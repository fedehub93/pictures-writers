# 10: Generic actions — HTTP request, web search, LLM

**What to build:** The three general-purpose actions that cover automation "of any nature". HTTP Request performs a method/URL/headers/body call, optionally using a Credential, with output = response. Web Search runs a query through a search provider using a Credential, output = results. LLM runs a provider/model with a templated prompt using a Credential, output = text. All configuration strings support template expressions from the run payload and predecessor outputs. These are the only feature additions requiring new provider dependencies.

**Blocked by:** 05, 04

**Status:** resolved

- [x] HTTP Request executes templated calls with optional Credential and exposes the response to downstream nodes; errors surface as Step failures.
- [x] Web Search and LLM nodes run against their providers with Credential auth; requests are shaped from templates and outputs flow downstream.
- [x] Template interpolation resolves in every config string for all three nodes.
- [x] Tests exercise all three via the in-memory effects context (no real network/provider calls), plus unit tests for request shaping and interpolation.
- [x] Provider/architecture details keep the engine generic: these are just two more registered nodes (ADR-0003).

## Comments

Delivered:

- **Config resolvers** (`lib/actions/`): `resolveHttpRequestConfig`, `resolveWebSearchConfig`, `resolveLlmConfig` interpolate the whole node `data` via `interpolateAutomationValue`, so every string supports `{{ ... }}` from the incoming token, payload, and run/step. Missing/invalid config raises `MissingActionConfigError`, which the registry converts to a permanent `AutomationNodeError` (Step failure).
- **Handlers** (`lib/node-registry.ts`): the three placeholders were replaced by an `actionHandler` that resolves config, resolves the Credential *id* (never the secret), and delegates to the injected `http`/`webSearch`/`llm` effect. The default registry stays generic: no provider knowledge in the engine.
- **Provider shaping** (`lib/actions/providers.ts`, pure): builds bearer-auth HTTP requests (JSON content type for object bodies), Tavily/Brave/Serper web-search requests, and OpenAI-compatible chat completions; extracts results/assistant text. All require a Credential where the provider does.
- **Server effects** (`server/action-effects.ts`, `server-only`): resolve `credentialId` to its decrypted secret at the execution boundary (default DB reader; injectable in tests) and run the shaped request through an injectable `transport` (real `fetch` by default). Wired into `createAutomationRuntimeEffects`. Provider failures classify as permanent/transient; non-2xx surfaces as Step failures.
- **Credential reference** (`graph.ts`, `server/procedures.ts`): `credentialId` now travels into the published snapshot and is parsed onto `AutomationNode`; `Node.data` still never holds secret material. `toNodeRow`/snapshot resolve the id from `data.credentialId` (editor shape) or top-level.
- **UI** (shadcn): added `HTTP_REQUEST`, `WEB_SEARCH`, `LLM` to the core palette with default data + icons, plus config panels with a reusable `CredentialPicker` (Select over `credentials.getMany`). HTTP supports method/URL/headers/body; Web Search provider/query/maxResults; LLM provider/model/system/prompt/temperature/baseUrl.
- **Tests**: `lib/__tests__/action-nodes.test.ts` (resolvers, provider shaping/extraction, integration through the in-memory effects for all three, missing-config failure) and `server/__tests__/action-effects.test.ts` (credential injection, output normalization, LLM no-text failure). `automation-engine.test.ts` updated to the new effect request shape.
- Verified: `tsc --noEmit` clean; `vitest run` 491/491 (62 files); `eslint` clean on all touched files.

Decisions / non-blocking follow-ups:

- Outputs follow the spec literally: HTTP → parsed response, Web Search → the results list, LLM → the assistant text (no metadata wrapper), so downstream `{{ input }}` receives the value the spec promises.
- The HTTP credential is applied as `Authorization: Bearer` unless the node's headers already set Authorization. A configurable header/query scheme is deferred until a real provider needs it.
- Only OpenAI-compatible LLM and Tavily/Brave/Serper search providers are wired; adding one is a builder case plus a resolver list entry.