/**
 * Context Compiler
 *
 * Preprocesses wiki content into an optimized system prompt at startup.
 * Produces layered context that's structured for LLM consumption:
 *
 *   Layer 1: Identity & behavior (from config prompts.system)
 *   Layer 2: Data primitives (extracted from wiki, compact schema format)
 *   Layer 3: Catalog summary (from query plugin)
 *   Layer 4: Wiki reference (condensed, annotated)
 *   Layer 5: Anchor directive (from config prompts.anchor — hidden from user)
 *
 * The compiled context is injected into every chat request.
 * Recompiles on startup or when wiki changes.
 */

import fs from 'fs';
import path from 'path';
import { load as yamlLoad } from 'js-yaml';
import { extractTextFromHtml } from './html-extractor.js';

export class ContextCompiler {
    constructor(config, plugins) {
        this.config = config;
        this.plugins = plugins;
        this.compiled = null;
    }

    /**
     * Compile all context layers into a structured system prompt.
     * Call once at startup; result is cached.
     */
    async compile() {
        const layers = [];

        // Layer 1: Identity & Behavior
        const systemPrompt = this.config?.prompts?.system || DEFAULT_SYSTEM_PROMPT;
        layers.push({ id: 'identity', content: systemPrompt });

        // Layer 2: Formal Specification (Cookbook + Primitives — PRIORITY CONTEXT)
        // This layer gets special framing so the LLM treats it as authoritative
        if (this.plugins.wiki) {
            const formalSpec = await this._extractFormalSpecification();
            if (formalSpec) {
                layers.push({ id: 'formal-spec', content: formalSpec });
            }
        }

        // Layer 3: Catalog Summary (from query plugin)
        if (this.plugins.query) {
            try {
                const ctx = await this.plugins.query.getContext();
                if (ctx.systemPromptAddition) {
                    layers.push({ id: 'catalog', content: ctx.systemPromptAddition });
                }
            } catch {}
        }

        // Layer 4: Wiki Reference (condensed — everything except cookbook/primitives)
        if (this.plugins.wiki) {
            const mode = this.config?.context?.wiki_mode || 'full';
            const wikiContent = await this._compileWiki(mode);
            if (wikiContent) {
                layers.push({ id: 'wiki', content: wikiContent });
            }
        }

        // Layer 5: Anchor (always at the end, hidden from user)
        const anchor = this.config?.prompts?.anchor || '';
        if (anchor) {
            layers.push({ id: 'anchor', content: anchor });
        }

        this.compiled = layers;
        const totalChars = layers.reduce((sum, l) => sum + l.content.length, 0);
        console.log(`📋 Context compiled: ${layers.length} layers, ~${Math.round(totalChars / 4)} tokens`);

        return this.compiled;
    }

    /**
     * Get the compiled system prompt as a single string.
     */
    getSystemPrompt() {
        if (!this.compiled) return DEFAULT_SYSTEM_PROMPT;
        return this.compiled.map(l => l.content).join('\n\n');
    }

    /**
     * Get the anchor message (injected as the last system/assistant message).
     */
    getAnchor() {
        const anchorLayer = this.compiled?.find(l => l.id === 'anchor');
        return anchorLayer?.content || '';
    }

    /**
     * Extract the formal specification from cookbook + primitives.
     * This is the HIGHEST PRIORITY context — framed to signal authority to the LLM.
     * Combines:
     *   - Cookbook page (axioms, typed definitions, theorems, temporal semantics)
     *   - Primitives catalog (operational schema mappings, business rules)
     */
    async _extractFormalSpecification() {
        const cookbookPageId = this.config?.context?.cookbook_page || 'cookbook';
        this._cookbookPageId = cookbookPageId;
        const lines = [];

        lines.push('╔══════════════════════════════════════════════════════════════════╗');
        lines.push('║  FORMAL DATA SPECIFICATION — AUTHORITATIVE REFERENCE            ║');
        lines.push('║  This section defines the mathematical and logical contracts    ║');
        lines.push('║  governing the datalake. Treat as ground truth for all queries, ║');
        lines.push('║  data questions, and compliance reasoning.                      ║');
        lines.push('╚══════════════════════════════════════════════════════════════════╝');
        lines.push('');

        // Part A: Cookbook (formal methods — axioms, definitions, theorems)
        try {
            const cookbook = await this.plugins.wiki.get(cookbookPageId);
            if (cookbook) {
                const parsed = yamlLoad(cookbook.content);
                lines.push('━━━ PART A: FORMAL MODEL (Axioms, Definitions, Theorems) ━━━');
                lines.push('');

                for (const section of (parsed.sections || [])) {
                    // Skip related-pages and purpose (meta, not spec)
                    if (section.id === 'related-pages' || section.id === 'purpose') continue;

                    if (section.heading) lines.push(`▸ ${section.heading}`);
                    if (section.content) lines.push(section.content.trim());
                    lines.push('');
                }
            }
        } catch (err) {
            // Cookbook not available — continue without it
        }

        // Part B: Primitives (operational mappings — tables, columns, rules)
        try {
            const primitives = await this.plugins.wiki.get('primitives');
            if (primitives) {
                const parsed = yamlLoad(primitives.content);
                lines.push('━━━ PART B: OPERATIONAL PRIMITIVES (Schema Contracts) ━━━');
                lines.push('Use these when generating SQL, answering schema questions, or validating data.');
                lines.push('');

                for (const section of (parsed.sections || [])) {
                    if (section.id === 'overview') continue;

                    if (section.primitive) {
                        const p = section.primitive;
                        lines.push(`┌─ ${p.name} ─────────────────────────────`);
                        if (p.database && p.source_table) {
                            lines.push(`│  Source: ${p.database}.${p.source_table}`);
                        }
                        if (p.publish_target) {
                            lines.push(`│  Publishes to: ${p.publish_target}`);
                        }
                        lines.push(`│  Fields:`);
                        for (const f of (p.fields || [])) {
                            lines.push(`│    ${f.name} (${f.type}): ${f.description || ''}`);
                        }
                        if (p.business_rules?.length) {
                            lines.push(`│  Business Rules:`);
                            for (const r of p.business_rules) {
                                lines.push(`│    ⚠ ${r}`);
                            }
                        }
                        lines.push(`└──────────────────────────────────────────`);
                        lines.push('');
                    } else if (section.heading && section.content) {
                        lines.push(`▸ ${section.heading}`);
                        lines.push(section.content.trim());
                        lines.push('');
                    }
                }
            }
        } catch (err) {
            // Primitives not available — continue without them
        }

        if (lines.length <= 8) return null; // Only header, no content
        return lines.join('\n');
    }

    /**
     * Compile wiki content based on mode:
     *   - "full": Include everything (condensed but complete)
     *   - "summary": Only titles + first paragraph of each page
     *   - "off": Don't include wiki in context
     */
    async _compileWiki(mode) {
        if (mode === 'off') return null;

        const pages = await this.plugins.wiki.list();
        if (!pages.length && !this.config?.plugins?.wiki?.html_path) return null;

        const lines = ['=== DOCUMENTATION REFERENCE ===',
            'The following documentation describes the datalake, pipelines, and governance.',
            'Reference this when answering questions. Cite page names when applicable.',
            ''];

        // Process YAML pages from the content directory
        for (const pageInfo of pages) {
            // Skip formal spec pages (already in Layer 2 with priority framing)
            if (pageInfo.id === 'primitives' || pageInfo.id === (this._cookbookPageId || 'cookbook')) continue;

            try {
                const page = await this.plugins.wiki.get(pageInfo.id);
                if (!page) continue;

                if (page.format === 'yaml') {
                    const parsed = yamlLoad(page.content);
                    lines.push(`--- [${parsed.title || pageInfo.id}] ---`);
                    if (parsed.subtitle) lines.push(parsed.subtitle);
                    lines.push('');

                    if (mode === 'full') {
                        for (const section of (parsed.sections || [])) {
                            if (section.heading) lines.push(`## ${section.heading}`);
                            if (section.content) lines.push(section.content.trim());

                            if (section.catalog) {
                                for (const item of section.catalog) {
                                    lines.push(`  • ${item.database}.${item.table} [${item.layer}/${item.format}] (${item.pipeline || ''}, ${item.frequency || ''})`);
                                }
                            }

                            if (section.table?.rows) {
                                const headers = section.table.headers || [];
                                lines.push(`  [${headers.join(' | ')}]`);
                                for (const row of section.table.rows.slice(0, 10)) {
                                    lines.push(`  ${row.join(' | ')}`);
                                }
                                if (section.table.rows.length > 10) {
                                    lines.push(`  ... (${section.table.rows.length - 10} more rows)`);
                                }
                            }
                            lines.push('');
                        }
                    } else {
                        const firstSection = parsed.sections?.[0];
                        if (firstSection?.content) {
                            lines.push(firstSection.content.trim().slice(0, 200));
                        }
                        lines.push('');
                    }
                } else {
                    lines.push(`--- [${pageInfo.title || pageInfo.id}] ---`);
                    if (mode === 'full') {
                        lines.push(page.content.slice(0, 2000));
                    } else {
                        lines.push(page.content.slice(0, 200));
                    }
                    lines.push('');
                }
            } catch {}
        }

        // Process HTML pages (extract text, strip JS/CSS/markup)
        const htmlPath = this.config?.plugins?.wiki?.html_path;
        if (htmlPath && fs.existsSync(path.resolve(htmlPath))) {
            const resolvedPath = path.resolve(htmlPath);
            const htmlFiles = fs.readdirSync(resolvedPath)
                .filter(f => f.endsWith('.html') && f !== '_template.html' && f !== 'index.html');

            for (const file of htmlFiles) {
                try {
                    const filePath = path.join(resolvedPath, file);
                    const html = fs.readFileSync(filePath, 'utf8');
                    const text = extractTextFromHtml(html);

                    if (!text || text.length < 50) continue;

                    const title = file.replace('.html', '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                    lines.push(`--- [${title}] ---`);

                    if (mode === 'full') {
                        // Cap each HTML page at 3000 chars to avoid bloating
                        lines.push(text.slice(0, 3000));
                        if (text.length > 3000) lines.push('... (truncated)');
                    } else {
                        lines.push(text.slice(0, 300));
                    }
                    lines.push('');
                } catch {}
            }
        }

        return lines.join('\n');
    }
}

const DEFAULT_SYSTEM_PROMPT = `You are Lighthouse, an AI assistant for exploring and understanding a datalake.

Your capabilities:
- Answer questions about data, tables, pipelines, and governance
- Help write SQL queries based on the available schema and business rules
- Explain data lineage and relationships between entities
- Reference documentation when providing answers

Guidelines:
- Be precise about table names, column types, and join conditions
- Apply business rules (filters, exclusions) mentioned in the data primitives
- Cite documentation sources when referencing specific pages
- If you're unsure about a schema detail, say so rather than guessing`;
