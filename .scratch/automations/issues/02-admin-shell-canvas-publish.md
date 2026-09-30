# 02: Admin shell — automations list, canvas skeleton, draft and publish

**What to build:** The admin surface for automations: a sidebar entry (tools group) and permission keys (`automations.read`/`automations.write`), a list of Automations, and a visual canvas editor (React Flow, new dependency) where nodes can be placed, named, and connected. An Automation is saved as a draft and published with validation (at least one trigger node, no cycles), and publishing freezes the graph into the published snapshot. Pages follow the existing admin pattern (server page → auth + permission check → prefetch → hydrate → view).

**Blocked by:** 01

**Status:** resolved

- [x] Sidebar entry appears under tools and obeys the new permission keys; unauthorized access is rejected.
- [x] List view shows automations with name and status; creating/renaming/deleting works.
- [x] Canvas editor renders placed nodes and connections and persists them; editing a draft does not touch the published snapshot.
- [x] Publish action validates at least one trigger node and rejects cycles, then stores the published snapshot; unpublished Automations are flagged as such in the list.
- [x] The list and editor UI live inside the automations module (`list/ui` + `editor/ui`, with shared `server/` and `hooks/` at the module root) and use the domain vocabulary (node, connection, trigger, action).

## Comments

Delivered (see `src/modules/automations/`):

- Sidebar tools entry with `automations.read`; pages gated by `requirePermission(AUTOMATIONS_READ)`, write paths by `AUTOMATIONS_WRITE` / `permissionProcedure`; permission keys added in migration `20260924130000_add_automations_permissions`.
- List: table with name/status, search/status filters, pagination; create/rename/delete via `getMany`/`create`/`updateName`/`remove`.
- Canvas: React Flow editor (`editor/ui/views/editor-view.tsx`), node palette + designer components via `editor/config/node-components.ts`, draft persistence via `update` (nodes/connections rewritten in a transaction; never touches `publishedSnapshot`/`status`).
- Publish: `publish` validates the graph (`lib/validate.ts`: ≥1 trigger, no cycles), freezes it into `publishedSnapshot` and sets `status=PUBLISHED` (ADR-0004); DRAFT automations show a DRAFT badge in list and editor header.
- Verified: `tsc` clean, `eslint` 0 errors (2 pre-existing `<img>` warnings in `editor/ui/components/canvas/node-selector.tsx`), `vitest` 24/24 on the test DB.
- Non-blocking follow-ups: `execute` is still a stub (`sendAutomationExecution` commented out) — real run bookkeeping is issue 03; per-node config panels are minimal; node type strings are uppercase in the draft while the spec uses lowercase — coordinate with the engine node registry (03/05); unconverted `INITIAL` nodes land in the snapshot, so the registry must ignore unknown types.