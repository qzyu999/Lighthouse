/**
 * Static Catalog + HTTP Execute Query Plugin
 *
 * Reads the table catalog from a local YAML file (no network needed for schema).
 * Proxies actual SQL execution to an HTTP endpoint (optional — returns error if not configured).
 *
 * This is ideal when:
 * - Your schema is stable and version-controlled
 * - You want the schema browser to work offline/locally
 * - SQL execution goes through a separate service (Lambda, API Gateway, etc.)
 *
 * Config:
 *   provider: "static"
 *   catalog_file: "./path/to/catalog.yaml"   (relative to backend/ or absolute)
 *   execute_url: "https://your-api/query"    (optional — for running SQL)
 *   execute_auth_scheme: "bearer"            (optional)
 *   execute_api_key_secret: "query_key"      (optional)
 */

import fs from 'fs';
import path from 'path';
import { load as yamlLoad } from 'js-yaml';
import { fileURLToPath } from 'url';
import { QueryPlugin } from '../query.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class StaticQueryPlugin extends QueryPlugin {
    constructor(config) {
        super(config);
        this.catalogData = this._loadCatalog(config.catalog_file);
        this.executeUrl = config.execute_url || '';
        this.authScheme = config.execute_auth_scheme || 'none';
        this.apiKey = this._resolveSecret(config.execute_api_key_secret);
    }

    _resolveSecret(secretName) {
        if (!secretName) return '';
        const secretPath = path.resolve(__dirname, '../../secrets', `${secretName}.txt`);
        if (fs.existsSync(secretPath)) {
            return fs.readFileSync(secretPath, 'utf8').trim();
        }
        return '';
    }

    _loadCatalog(catalogFile) {
        if (!catalogFile) return { databases: [] };
        const resolved = path.resolve(__dirname, '../..', catalogFile);
        if (!fs.existsSync(resolved)) {
            console.warn(`⚠️  Static catalog file not found: ${resolved}`);
            return { databases: [] };
        }
        try {
            const raw = yamlLoad(fs.readFileSync(resolved, 'utf8'));
            return raw || { databases: [] };
        } catch (err) {
            console.warn(`⚠️  Failed to parse catalog file: ${err.message}`);
            return { databases: [] };
        }
    }

    async getCatalog() {
        return this.catalogData;
    }

    async execute(sql) {
        if (!this.executeUrl) {
            return {
                columns: [],
                rows: [],
                metadata: { error: 'No execute_url configured. Set plugins.query.execute_url in config to enable SQL execution.' },
            };
        }

        try {
            const headers = { 'Content-Type': 'application/json' };
            if (this.apiKey && this.authScheme !== 'none') {
                headers['Authorization'] = this.authScheme === 'basic'
                    ? `basic ${this.apiKey}`
                    : `Bearer ${this.apiKey}`;
            }

            const res = await fetch(this.executeUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ sql }),
            });

            if (!res.ok) {
                const errBody = await res.text();
                return { columns: [], rows: [], metadata: { error: `API returned ${res.status}: ${errBody.slice(0, 200)}` } };
            }
            return await res.json();
        } catch (err) {
            return { columns: [], rows: [], metadata: { error: err.message } };
        }
    }

    async validate(sql) {
        if (!sql || !sql.trim()) return { valid: false, error: 'Empty query' };
        return { valid: true };
    }

    async getContext() {
        const lines = ['Available tables for SQL queries:'];
        for (const db of (this.catalogData.databases || [])) {
            for (const table of (db.tables || [])) {
                const cols = (table.columns || []).map(c => `${c.name} (${c.type})`).join(', ');
                lines.push(`  ${db.name}.${table.name}: ${cols}`);
            }
        }
        return { systemPromptAddition: lines.join('\n') };
    }
}
