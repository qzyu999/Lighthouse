/**
 * Query Engine Plugin Interface
 *
 * Any query provider must implement:
 *   - getCatalog()          → { databases: [{ name, tables: [{ name, columns }] }] }
 *   - execute(sql)          → { columns, rows, metadata? }
 *   - validate(sql)         → { valid, error? }
 *   - getContext()          → { systemPromptAddition }
 *
 * The getContext() method returns schema information formatted for injection
 * into the LLM system prompt, so the LLM can generate correct SQL.
 */

export class QueryPlugin {
    constructor(config) {
        this.config = config;
    }

    /** Get the full data catalog (databases, tables, columns) */
    async getCatalog() {
        throw new Error('QueryPlugin.getCatalog() not implemented');
    }

    /** Execute a SQL query and return results */
    async execute(sql) {
        throw new Error('QueryPlugin.execute() not implemented');
    }

    /** Validate SQL syntax without executing */
    async validate(sql) {
        throw new Error('QueryPlugin.validate() not implemented');
    }

    /**
     * Get schema context for LLM prompt injection.
     * Returns a string describing available tables/columns
     * that helps the LLM generate correct queries.
     */
    async getContext() {
        throw new Error('QueryPlugin.getContext() not implemented');
    }
}
