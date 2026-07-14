/**
 * Mock Agent Plugin
 *
 * Simulates delegation to an agent system for development/testing.
 * Replace with agent-containerclaw.js for real multi-agent delegation.
 *
 * Config:
 *   url: "http://localhost:50051" (agent system endpoint)
 */

import { AgentPlugin } from '../agent.js';

export class MockAgentPlugin extends AgentPlugin {
    constructor(config) {
        super(config);
    }

    async isAvailable() {
        return true;
    }

    async delegate(task) {
        return {
            result: `[Mock Agent] I would process this task: "${task.prompt.slice(0, 100)}..." ` +
                    `with ${task.context?.length || 0} chars of context. ` +
                    `In production, this delegates to a multi-agent system (e.g., ContainerClaw) ` +
                    `that can run tools, query databases, and consolidate results.`,
            sources: [
                { type: 'wiki', id: 'getting-started', title: 'Getting Started' },
            ],
            artifacts: [],
        };
    }

    async getCapabilities() {
        return [
            { name: 'query', description: 'Execute SQL queries against the datalake' },
            { name: 'report', description: 'Generate reports from multiple data sources' },
            { name: 'analyze', description: 'Deep analysis with multi-step reasoning' },
        ];
    }
}
