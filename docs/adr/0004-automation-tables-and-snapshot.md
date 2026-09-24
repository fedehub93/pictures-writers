# Normalized node/connection tables with a published snapshot instead of a versioned JSON blob

**Status**: accepted

Automation definitions are stored relationally (`Automation`, `Node`, `Connection` tables — reusing the earlier tutorial model) rather than as a single JSON column, consistent with the visual canvas editor which needs per-node positions. Each Automation has exactly the states `DRAFT`/`PUBLISHED` plus a `publishedSnapshot` captured at publish; runs execute the snapshot, so editing or republishing never corrupts running or historical executions. Full version history (every save = a version, rollback, diffs) is deliberately out of scope; snapshot-at-publish covers the real need and versioning can be layered on later.

## Considered options

- **Single JSON on `Automation`** (the Puck/`Form.content` precedent): atomic saves and easy versioning, but discards the already-working tutorial model and is harder to query. Rejected.
- **Full version history**: overkill; no current use case. Rejected.

## Consequences

- Editing a workflow becomes many-row transactional writes (nodes + connections in one transaction).
- With a canvas editor the graph is allowed to fan out; cycles are rejected by the editor and guarded at runtime.