# 10: Generic actions — HTTP request, web search, LLM

**What to build:** The three general-purpose actions that cover automation "of any nature". HTTP Request performs a method/URL/headers/body call, optionally using a Credential, with output = response. Web Search runs a query through a search provider using a Credential, output = results. LLM runs a provider/model with a templated prompt using a Credential, output = text. All configuration strings support template expressions from the run payload and predecessor outputs. These are the only feature additions requiring new provider dependencies.

**Blocked by:** 05, 04

**Status:** ready-for-agent

- [ ] HTTP Request executes templated calls with optional Credential and exposes the response to downstream nodes; errors surface as Step failures.
- [ ] Web Search and LLM nodes run against their providers with Credential auth; requests are shaped from templates and outputs flow downstream.
- [ ] Template interpolation resolves in every config string for all three nodes.
- [ ] Tests exercise all three via the in-memory effects context (no real network/provider calls), plus unit tests for request shaping and interpolation.
- [ ] Provider/architecture details keep the engine generic: these are just two more registered nodes (ADR-0003).