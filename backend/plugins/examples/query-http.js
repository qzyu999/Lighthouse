/**
 * HTTP Query Plugin
 *
 * Proxies SQL queries to an existing backend API that handles
 * database connectivity, credentials, and pagination.
 *
 * This is the recommended approach when your query engine is already
 * deployed behind an API Gateway/Lambda/service — no direct DB connection needed.
 *
 * Config:
 *   provider: "http"
 *   api_url: "https://your-query-api.example.com"   (base URL)
 *   endpoints:
 *     execute: "/query"          (POST — runs SQL)
 *     catalog: "/catalog"        (GET — returns schema)
 *     validate: "/validate"      (POST — checks SQL syntax)
 *   headers:                     (optional extra headers)
 *     x-api-key: "..."
 *   auth_scheme: "bearer"        (optional: "bearer" | "basic" | "none")
 *   api_key_secret: "query_api_key"  (optional: resolved from secrets/)
 *   page_size: 1000              (optional: pagination size)
 */

import { QueryPlugin } from '../query.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class HttpQueryPlugin extends QueryPlugin {
    constructor(config) {
        super(config);
        this.apiUrl = (config.api_url || '').replace(/\/$/, '');
        this.endpoints = config.endpoints || {
            execute: '/query',
            catalog: '/catalog',
            validate: '/validate',
        };
        this.pageSize = config.page_size || 1000;
        this.extraHeaders = config.headers || {};
        this.authScheme = config.auth_scheme || 'none';
        this.apiKey = this._resolveApiKey(config);
    }

    _resolveApiKey(config) {
        if (config.api_key) return config.api_key;
        if (config.api_key_secret) {
            const secretPath = path.resolve(__dirname, '../../secrets', `${config.api_key_secret}.txt`);
            if (fs.existsSync(secretPath)) {
                return fs.readFileSync(secretPath, 'utf8').trim();
            }
        }
        return '';
    }

    _buildHeaders() {
        const headers = {
            'Content-Type': 'application/json',
            ...this.extraHeaders,
        };
        if (this.apiKey && this.authScheme !== 'none') {
            if (this.authScheme === 'basic') {
                headers['Authorization'] = `basic ${this.apiKey}`;
            } else {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
        }
        return headers;
    }

    async getCatalog() {
        if (!this.apiUrl) {
            return { databases: [] };
        }
        try {
            const url = `${this.apiUrl}${this.endpoints.catalog}`;
            const res = await fetch(url, {
                method: 'GET',
                headers: this._buildHeaders(),
            });
            if (!res.ok) throw new Error(`Catalog API returned ${res.status}`);
            return await res.json();
        } catch (err) {
            console.warn('⚠️  HTTP Query catalog fetch failed:', err.message);
            return { databases: [] };
        }
    }

    async execute(sql) {
        if (!this.apiUrl) {
            return { columns: [], rows: [], metadata: { error: 'No api_url configured' } };
        }
        try {
            const url = `${this.apiUrl}${this.endpoints.execute}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: this._buildHeaders(),
                body: JSON.stringify({ sql, page_size: this.pageSize }),
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
        if (!this.apiUrl) {
            return { valid: false, error: 'No api_url configured' };
        }
        try {
            const url = `${this.apiUrl}${this.endpoints.validate}`;
            const res = await fetch(url, {
                method: 'POST',
                headers: this._buildHeaders(),
                body: JSON.stringify({ sql }),
            });
            if (!res.ok) return { valid: false, error: `API returned ${res.status}` };
            return await res.json();
        } catch (err) {
            return { valid: false, error: err.message };
        }
    }

    async getContext() {
        const catalog = await this.getCatalog();
        if (!catalog.databases?.length) {
            return { systemPromptAddition: '' };
        }
        const lines = ['Available tables for SQL queries:'];
        for (const db of catalog.databases) {
            for (const table of (db.tables || [])) {
                const cols = (table.columns || []).map(c => `${c.name} (${c.type})`).join(', ');
                lines.push(`  ${db.name}.${table.name}: ${cols}`);
            }
        }
        return { systemPromptAddition: lines.join('\n') };
    }
}
