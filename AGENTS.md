# Lighthouse — AI Agent Coding Guide

Guidance for AI coding agents contributing to Lighthouse.

## Project Overview

Lighthouse is a pluggable AI chatbot for datalake exploration. It connects to any OpenAI-compatible LLM provider and integrates wiki documentation, query engines, and multi-agent delegation through a config-driven plugin system.

## Architecture

```
client/              → React (Vite), chat UI, wiki iframe, model picker
backend/             → Express, LLM gateway proxy, plugin system, context compiler
backend/plugins/     → Plugin interfaces + example implementations
backend/context/     → Context compiler, HTML extractor, prompt engineering
config.yaml          → Committed config (no secrets)
config.local.yaml    → Private overrides (gitignored)
secrets/             → API keys (gitignored)
```

## Critical Rules

### Secrets & Configuration

- **NEVER** commit API keys, enterprise URLs, or company-specific details
- All provider config uses `api_key_secret` referencing files in `secrets/`
- Enterprise-specific settings go in `config.local.yaml` (gitignored)
- `config.yaml` is committed and must remain generic/open-source safe

### Plugin Architecture

- **Interfaces** in `backend/plugins/{wiki,query,agent}.js` define the contract
- **Implementations** in `backend/plugins/examples/` are swappable providers
- New providers MUST implement all interface methods
- Config determines which provider loads — no hardcoded imports

### Context Engineering

- System prompt is compiled at startup by `backend/context/compiler.js`
- Layers: Identity → Primitives → Catalog → Wiki → Anchor
- Wiki content is preprocessed (YAML structured extraction + HTML text extraction)
- Anchor message is injected as the final system message (hidden from user)
- All prompt templates are configurable via `config.yaml` prompts section

### Code Style

- ES modules (`"type": "module"` in package.json)
- No TypeScript (keep it simple, portable)
- Async/await for all IO operations
- Config-driven over hardcoded values
- Fail gracefully — MongoDB optional (in-memory fallback), plugins optional

## Module Guide

### Backend

| Path | Role |
|------|------|
| `index.js` | Express app, routes, gateway proxy, plugin wiring |
| `models/` | Mongoose schemas (Chat, UserChats) |
| `plugins/wiki.js` | Wiki plugin interface |
| `plugins/query.js` | Query engine plugin interface |
| `plugins/agent.js` | Agent delegation plugin interface |
| `plugins/index.js` | Plugin loader (reads config, instantiates providers) |
| `plugins/examples/` | Built-in implementations (filesystem, mock) |
| `context/compiler.js` | Startup context compilation (layered prompts) |
| `context/html-extractor.js` | HTML → text extraction (strips JS/CSS/markup) |

### Client

| Path | Role |
|------|------|
| `src/main.jsx` | Router, app shell |
| `src/layouts/` | Root layout (header), Dashboard layout (sidebar + content) |
| `src/routes/chatPage/` | Chat view with streaming, cancel, regeneration |
| `src/routes/dashboardPage/` | Landing page with quick actions |
| `src/routes/wikiPage/` | Wiki iframe viewer |
| `src/components/newPrompt/` | Message input, streaming controller, abort handling |
| `src/components/chatList/` | Sidebar chat history with search |
| `src/components/modelMenu/` | Dynamic model picker (fetches from provider API) |
| `src/components/messageMenu/` | Per-message actions (copy, regenerate, model change) |
| `src/lib/gemini.js` | Gateway client (Gemini interface shim) |
| `src/lib/azureopenai.js` | Gateway client (OpenAI interface shim) |

## Key Patterns

### Config Overlay

`config.local.yaml` is deep-merged on top of `config.yaml`. Use for:
- Enterprise LLM endpoints
- Private wiki paths
- Model filters
- Custom anchor/system prompts

### Generation Controller (NewPrompt)

Each generation gets a unique Symbol ID. All state updates check "is this still the active generation?" before proceeding. This prevents stale async operations from corrupting state after cancel.

```
generate() → creates Symbol ID → stored in activeGenRef
handleStop() → nullifies activeGenRef → aborts fetch → saves partial
stream loop → checks activeGenRef.id === myId before every state update
```

### LLM Gateway Proxy

All LLM calls route through `POST /api/chat/completions`:
1. Reads provider config (URL, auth scheme, settings)
2. Injects compiled context (system prompt + wiki + anchor)
3. Forwards to provider with streaming enabled
4. Converts provider-specific stream format to standard SSE
5. Pipes SSE chunks back to client

### Plugin Contract

```javascript
// Any wiki provider must implement:
list()           → [{ id, title }]
get(id)          → { id, title, content, format }
search(query)    → [{ id, title, snippet }]
getContext(query) → { systemPromptAddition, references }

// Any query provider must implement:
getCatalog()     → { databases: [{ name, tables }] }
execute(sql)     → { columns, rows }
validate(sql)    → { valid, error? }
getContext()     → { systemPromptAddition }

// Any agent provider must implement:
isAvailable()    → boolean
delegate(task)   → { result, sources, artifacts }
getCapabilities() → [{ name, description }]
```

## Build & Run

```bash
# Backend
cd backend && npm install && npm start

# Frontend (separate terminal)
cd client && npm install && npm run dev

# MongoDB (optional — falls back to in-memory)
docker run -d --name mongo -p 27017:27017 mongo:7
```

## Git Conventions

- Commit messages: descriptive, no component prefix required
- Never commit `config.local.yaml`, `secrets/*.txt`, `backend/.env`, `client/.env`
- Force-push only when amending the latest commit (don't rewrite shared history)
- Keep PRs focused on one concern

## Boundaries

- **NEVER** commit enterprise-specific URLs, API keys, or company names
- **NEVER** hardcode provider-specific logic — use the plugin interface
- **NEVER** add dependencies without justification (keep it lightweight)
- **ASK** before changing plugin interfaces (they're the API contract)
- **ASK** before modifying context compiler layers (affects all responses)
