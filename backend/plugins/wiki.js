/**
 * Wiki Plugin Interface
 *
 * Any wiki provider must implement:
 *   - list()              → [{ id, title, updated? }]
 *   - get(id)             → { id, title, content, metadata? }
 *   - search(query)       → [{ id, title, snippet }]
 *   - getContext(query)   → { systemPromptAddition, references[] }
 *
 * The getContext() method is used by the chat engine to inject relevant
 * wiki knowledge into the LLM system prompt before generating a response.
 * This enables RAG-lite behavior without a separate vector DB.
 *
 * Content is returned as raw text (markdown, YAML, HTML — frontend handles rendering).
 */

export class WikiPlugin {
    constructor(config) {
        this.config = config;
    }

    /** List all available wiki pages */
    async list() {
        throw new Error('WikiPlugin.list() not implemented');
    }

    /** Get a specific page by ID */
    async get(id) {
        throw new Error('WikiPlugin.get() not implemented');
    }

    /** Full-text search across wiki content */
    async search(query) {
        throw new Error('WikiPlugin.search() not implemented');
    }

    /**
     * Get relevant context for a user query.
     * Used to augment the LLM system prompt with wiki knowledge.
     *
     * Returns:
     *   {
     *     systemPromptAddition: string,  // Text to append to system prompt
     *     references: [{ id, title, snippet }]  // Pages used (for citation)
     *   }
     */
    async getContext(query) {
        throw new Error('WikiPlugin.getContext() not implemented');
    }
}
