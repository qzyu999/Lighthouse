/**
 * Plugin Loader
 *
 * Reads plugin config from the merged config.yaml / config.local.yaml
 * and instantiates the appropriate provider for each plugin type.
 *
 * Supported plugins:
 *   - wiki: { provider: "filesystem", path: "./content" }
 *   - query: { provider: "mock" }
 *   - agent: { provider: "mock" }
 *
 * Custom providers can be added by creating a file in plugins/examples/
 * or anywhere on disk and referencing via provider name.
 */

import { FilesystemWikiPlugin } from './examples/wiki-filesystem.js';
import { MockQueryPlugin } from './examples/query-mock.js';
import { HttpQueryPlugin } from './examples/query-http.js';
import { StaticQueryPlugin } from './examples/query-static.js';
import { MockAgentPlugin } from './examples/agent-mock.js';

// Registry of built-in providers
const WIKI_PROVIDERS = {
    filesystem: FilesystemWikiPlugin,
};

const QUERY_PROVIDERS = {
    mock: MockQueryPlugin,
    http: HttpQueryPlugin,
    static: StaticQueryPlugin,
};

const AGENT_PROVIDERS = {
    mock: MockAgentPlugin,
};

export function loadPlugins(config) {
    const plugins = {};
    const pluginConfig = config?.plugins || {};

    // Wiki plugin
    const wikiConf = pluginConfig.wiki || { provider: 'filesystem', path: './content' };
    const WikiClass = WIKI_PROVIDERS[wikiConf.provider];
    if (WikiClass) {
        plugins.wiki = new WikiClass(wikiConf);
        console.log(`📖 Wiki plugin loaded: ${wikiConf.provider} (${wikiConf.path || 'default'})`);
    } else {
        console.warn(`⚠️  Unknown wiki provider: ${wikiConf.provider}`);
    }

    // Query plugin
    const queryConf = pluginConfig.query || { provider: 'mock' };
    const QueryClass = QUERY_PROVIDERS[queryConf.provider];
    if (QueryClass) {
        plugins.query = new QueryClass(queryConf);
        console.log(`🔍 Query plugin loaded: ${queryConf.provider}`);
    } else {
        console.warn(`⚠️  Unknown query provider: ${queryConf.provider}`);
    }

    // Agent plugin
    const agentConf = pluginConfig.agent || { provider: 'mock' };
    const AgentClass = AGENT_PROVIDERS[agentConf.provider];
    if (AgentClass) {
        plugins.agent = new AgentClass(agentConf);
        console.log(`🤖 Agent plugin loaded: ${agentConf.provider}`);
    } else {
        console.warn(`⚠️  Unknown agent provider: ${agentConf.provider}`);
    }

    return plugins;
}
