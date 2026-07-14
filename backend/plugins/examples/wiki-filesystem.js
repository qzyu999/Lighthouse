/**
 * Filesystem Wiki Plugin
 *
 * Reads wiki pages from YAML files on disk.
 * Works with the sor-wiki content format: YAML files with title, sections, tables, etc.
 *
 * Config:
 *   path: "./content"   (relative to backend/ or absolute path)
 */

import fs from 'fs';
import path from 'path';
import { load as yamlLoad } from 'js-yaml';
import { WikiPlugin } from '../wiki.js';

export class FilesystemWikiPlugin extends WikiPlugin {
    constructor(config) {
        super(config);
        this.basePath = path.resolve(config.path || './content');
    }

    async list() {
        if (!fs.existsSync(this.basePath)) return [];

        const files = fs.readdirSync(this.basePath)
            .filter(f => f.endsWith('.yaml') || f.endsWith('.yml') || f.endsWith('.md'));

        return files.map(file => {
            const id = file.replace(/\.(yaml|yml|md)$/, '');
            try {
                const raw = fs.readFileSync(path.join(this.basePath, file), 'utf8');
                const parsed = file.endsWith('.md') ? { title: id } : yamlLoad(raw);
                return {
                    id,
                    title: parsed?.title || id,
                    updated: parsed?.updated || null,
                };
            } catch {
                return { id, title: id, updated: null };
            }
        });
    }

    async get(id) {
        const extensions = ['.yaml', '.yml', '.md'];
        for (const ext of extensions) {
            const filePath = path.join(this.basePath, id + ext);
            if (fs.existsSync(filePath)) {
                const raw = fs.readFileSync(filePath, 'utf8');
                if (ext === '.md') {
                    return { id, title: id, content: raw, format: 'markdown' };
                }
                const parsed = yamlLoad(raw);
                return {
                    id,
                    title: parsed?.title || id,
                    content: raw,
                    metadata: {
                        subtitle: parsed?.subtitle,
                        updated: parsed?.updated,
                        sections: parsed?.sections?.map(s => s.heading).filter(Boolean),
                    },
                    format: 'yaml',
                };
            }
        }
        return null;
    }

    async search(query) {
        const pages = await this.list();
        const q = query.toLowerCase();
        const results = [];

        for (const page of pages) {
            const extensions = ['.yaml', '.yml', '.md'];
            for (const ext of extensions) {
                const filePath = path.join(this.basePath, page.id + ext);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
                    if (content.includes(q)) {
                        const idx = content.indexOf(q);
                        const start = Math.max(0, idx - 60);
                        const end = Math.min(content.length, idx + q.length + 60);
                        const snippet = content.slice(start, end).replace(/\n/g, ' ').trim();
                        results.push({ id: page.id, title: page.title, snippet: `...${snippet}...` });
                    }
                    break;
                }
            }
        }

        return results;
    }

    /**
     * Get relevant wiki context for a user query.
     * Searches all pages, extracts matching sections, and formats
     * them as a system prompt addition with references.
     *
     * Uses keyword matching (no vector DB required).
     * For better relevance, swap this with a vector-based provider.
     */
    async getContext(query) {
        const MAX_CONTEXT_CHARS = 3000; // Don't overload the prompt
        const results = await this.search(query);

        if (results.length === 0) {
            return { systemPromptAddition: '', references: [] };
        }

        // Load full content of top matching pages (max 3)
        const topResults = results.slice(0, 3);
        const references = [];
        let contextParts = [];
        let totalChars = 0;

        for (const result of topResults) {
            const page = await this.get(result.id);
            if (!page) continue;

            // Extract relevant sections from YAML pages
            let relevantText = '';
            if (page.format === 'yaml') {
                try {
                    const parsed = yamlLoad(page.content);
                    const q = query.toLowerCase();

                    // Pull sections that match the query
                    for (const section of (parsed.sections || [])) {
                        const sectionText = JSON.stringify(section).toLowerCase();
                        if (sectionText.includes(q) || this._fuzzyMatch(q, sectionText)) {
                            relevantText += `## ${section.heading || ''}\n`;
                            if (section.content) relevantText += section.content + '\n';
                            if (section.catalog) {
                                relevantText += 'Data products:\n';
                                for (const item of section.catalog.slice(0, 10)) {
                                    relevantText += `  - ${item.database}.${item.table} (${item.layer}, ${item.format})\n`;
                                }
                            }
                            if (section.table) {
                                relevantText += `Columns: ${section.table.headers?.join(', ')}\n`;
                                for (const row of (section.table.rows || []).slice(0, 5)) {
                                    relevantText += `  - ${row.join(' | ')}\n`;
                                }
                            }
                            relevantText += '\n';
                        }
                    }

                    // If no section matched, use the full page title + subtitle
                    if (!relevantText && parsed.title) {
                        relevantText = `${parsed.title}: ${parsed.subtitle || ''}\n`;
                    }
                } catch {
                    relevantText = page.content.slice(0, 500);
                }
            } else {
                // Markdown — just include the content
                relevantText = page.content.slice(0, 1000);
            }

            if (relevantText && totalChars + relevantText.length <= MAX_CONTEXT_CHARS) {
                contextParts.push(`[Source: ${page.title}]\n${relevantText}`);
                totalChars += relevantText.length;
                references.push({ id: result.id, title: page.title || result.id, snippet: result.snippet });
            }
        }

        if (contextParts.length === 0) {
            return { systemPromptAddition: '', references: [] };
        }

        const systemPromptAddition = [
            '--- RELEVANT DOCUMENTATION ---',
            'The following documentation may be relevant to the user\'s question:',
            '',
            ...contextParts,
            '',
            '--- END DOCUMENTATION ---',
            'Use the above documentation to inform your response. Cite sources when applicable.',
        ].join('\n');

        return { systemPromptAddition, references };
    }

    /** Simple fuzzy match — checks if most words in the query appear in the text */
    _fuzzyMatch(query, text) {
        const words = query.split(/\s+/).filter(w => w.length > 2);
        if (words.length === 0) return false;
        const matches = words.filter(w => text.includes(w));
        return matches.length >= Math.ceil(words.length * 0.5);
    }
}
