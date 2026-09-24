# 04: Credentials store and UI

**What to build:** Reusable, encrypted Credentials so nodes (webhook, HTTP, LLM, web search) never hold secrets. A renderer that encrypts at rest (AES, key from environment), a CRUD admin surface, and a credential picker inside node configuration. Secrets never land in node data or run/step snapshots.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] Credentials can be created, renamed, and deleted; the secret is encrypted at rest with a key from the environment and never returned in plaintext by reads.
- [ ] A node's configuration can reference a credential by id; run snapshots and node data contain no secret material.
- [ ] Encryption round-trips correctly; a missing env key fails loudly in development.
- [ ] Follows ADR-0004/0005 conventions: the Credential model is domain-agnostic (a generic named secret holder).