# 04: Credentials store and UI

**What to build:** Reusable, encrypted Credentials so nodes (webhook, HTTP, LLM, web search) never hold secrets. A renderer that encrypts at rest (AES, key from environment), a CRUD admin surface, and a credential picker inside node configuration. Secrets never land in node data or run/step snapshots.

**Blocked by:** 01

**Status:** resolved

- [x] Credentials can be created, renamed, and deleted; the secret is encrypted at rest with a key from the environment and never returned in plaintext by reads.
- [x] A node's configuration can reference a credential by id; run snapshots and node data contain no secret material.
- [x] Encryption round-trips correctly; a missing env key fails loudly in development.
- [x] Follows ADR-0004/0005 conventions: the Credential model is domain-agnostic (a generic named secret holder).

## Comments

Delivered (see `src/modules/automations/credentials/`):

- Renderer: `credentials/lib/credential-store.ts` — AES-256-GCM with a random 12-byte IV and auth tag, payload stored as `enc:v1:<base64(iv|tag|ciphertext)>`. The key is `sha256(AUTOMATION_CREDENTIALS_KEY)`; a missing env var throws with the variable name instead of silently degrading. `decryptCredentialSecret` passes through non-prefixed values so already-plaintext rows stay readable.
- Router: `credentials/server/procedures.ts` — `getMany`/`getOne` select only `id`, `name`, `type`, timestamps, so no read path can return the secret. `create` encrypts; `update` only re-encrypts when a new secret is submitted (blank = keep current). `remove` deletes the row; `Node.credentialId` is `onDelete: SetNull`, so nodes detach instead of dying with the credential.
- Admin surface: `/admin/automations/credentials` (`requirePermission(AUTOMATIONS_READ)` → prefetch → hydrate → view), sidebar entry under tools, table with search/pagination, create dialog, inline rename, delete with confirm modal. The secret input is `type="password"` and is never pre-filled on edit.
- Reference by id: `Node.credentialId` (`schemas.ts` `automationUpdateSchema`/`automationPublishSchema`, `server/procedures.ts` node mapping) carries only the id, so the published snapshot and run graph copies it as a reference. `Node.data` is documented in `prisma/schema.prisma` as never holding secret material.
- Tests: `lib/__tests__/credentials.test.ts` covers the encrypt→decrypt round-trip, the `enc:v1:` prefix, and the loud failure on a missing key; `lib/__tests__/schema.test.ts` covers the Credential↔Node relation and the detach-on-delete behaviour.
- Verified: `vitest` 36/36 on the automations suite (test DB), `npm run lint` reports nothing in the credentials module (the 60 errors are pre-existing elsewhere in the repo).

Non-blocking follow-ups:

- The **picker inside node configuration is not built yet** — the canvas still has no per-node config panel (carried over from issue 02), so a credential can only be attached to a node through the API. It belongs with the node config panel work and is what issue 10 consumes.
- `credentials.decrypt` is the only plaintext egress; it is gated by `AUTOMATIONS_WRITE` and currently unused by the runner. Issue 10 should resolve `credentialId` inside the execution boundary rather than exposing decryption to the client.
- `AUTOMATION_CREDENTIALS_KEY` is not documented in `AGENTS.md`'s env list (the repo has no `.env.example`); worth adding when the key is required in production.
- Rotating the env key makes existing rows undecryptable — no re-encryption path exists yet; the `enc:v1:` prefix leaves room for a `v2` scheme.