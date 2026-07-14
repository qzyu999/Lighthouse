/**
 * Mock Query Plugin
 *
 * Returns sample data for development/testing.
 * Replace with query-athena.js or query-redshift.js for real use.
 */

import { QueryPlugin } from '../query.js';

export class MockQueryPlugin extends QueryPlugin {
    constructor(config) {
        super(config);
    }

    async getCatalog() {
        return {
            databases: [
                {
                    name: "analytics",
                    tables: [
                        {
                            name: "users",
                            columns: [
                                { name: "id", type: "bigint" },
                                { name: "email", type: "varchar" },
                                { name: "name", type: "varchar" },
                                { name: "role", type: "varchar" },
                                { name: "created_at", type: "timestamp" },
                            ],
                        },
                        {
                            name: "orders",
                            columns: [
                                { name: "order_id", type: "bigint" },
                                { name: "user_id", type: "bigint" },
                                { name: "product", type: "varchar" },
                                { name: "amount", type: "decimal" },
                                { name: "status", type: "varchar" },
                                { name: "order_date", type: "timestamp" },
                            ],
                        },
                        {
                            name: "events",
                            columns: [
                                { name: "event_id", type: "bigint" },
                                { name: "user_id", type: "bigint" },
                                { name: "event_type", type: "varchar" },
                                { name: "metadata", type: "varchar" },
                                { name: "timestamp", type: "timestamp" },
                            ],
                        },
                    ],
                },
            ],
        };
    }

    async execute(sql) {
        // Simulate a query result
        return {
            columns: ["id", "email", "created_at"],
            rows: [
                [1, "alice@example.com", "2024-01-15T10:30:00Z"],
                [2, "bob@example.com", "2024-02-20T14:45:00Z"],
            ],
            metadata: {
                rowCount: 2,
                executionTimeMs: 142,
                note: "Mock data — configure a real query provider in config.local.yaml",
            },
        };
    }

    async validate(sql) {
        if (!sql || !sql.trim()) {
            return { valid: false, error: "Empty query" };
        }
        return { valid: true };
    }

    async getContext() {
        const catalog = await this.getCatalog();
        const lines = ['Available tables for SQL queries:'];
        for (const db of catalog.databases) {
            for (const table of db.tables) {
                const cols = table.columns.map(c => `${c.name} (${c.type})`).join(', ');
                lines.push(`  ${db.name}.${table.name}: ${cols}`);
            }
        }
        return { systemPromptAddition: lines.join('\n') };
    }
}
