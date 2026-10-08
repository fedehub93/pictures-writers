# Split the Page model into PageRoot + PageVersion (pilot)

**Status**: accepted

**Partially superseded by**: ADR 0012 (taxonomy is not versioned) drops `Category` and `Tag` from the list of entities intended to follow this split.

Content versioning used a single-table model: every revision of an item was a row in its own table (`Page`, `Post`, `Product`, …) distinguished by `rootId`, `version`, `status`, and `isLatest`. That model conflates identity with revision, duplicates large content columns per revision, overloads `isLatest` between "current draft" and "live published version", attaches external relationships to specific revisions, and implements publishing slightly differently per entity — with row-level locking only on Post. The CMS is becoming a generic, sellable product, so we split the simplest entity first to validate a shared pattern.

We introduce **Root + Version** for `Page`:

- `PageRoot` is the logical page. It owns the stable identity (`id`), the unique `slug`, `firstPublishedAt`, `createdAt`/`updatedAt`, and the external relationships (`Seo`, `User`). It points at exactly two special revisions through `currentVersionId` (the revision the editor is working on) and `liveVersionId` (the revision visible on the public site).
- `PageVersion` is one revision. It owns the mutable content — `title`, `puckData`, `status`, `publishedAt`, `scheduledAt`, `editorType`, `userId`, `seoId`, `imageCoverId` — and a `version` integer scoped to its root.
- Public reads resolve `slug → PageRoot → liveVersion`. Admin reads work on the root's current version and its history.
- Publishing acquires a row-level lock on the root, demotes the previous live revision to `CHANGED`, promotes the target revision to `PUBLISHED`, and updates `liveVersionId`. `firstPublishedAt` is written only on the root's first publication. Unpublishing clears `liveVersionId` and returns the revision to `CHANGED`.
- Editing a non-live current revision updates it in place; editing the live revision forks a new `CHANGED` revision so the live site is unaffected until the fork is published.

The legacy `Page` table and the dual-write path that kept it in sync were removed after the pilot proved out. `20261008130000_drop_legacy_page` backfills any remaining legacy rows into the new tables (idempotently, reusing legacy ids so dual-write rows converge) and then drops the old table, so the cut-over is the final, one-way step.

## Considered options

- **Explicit revision-state flags** (`isCurrentVersion` / `isPublishedVersion` on the existing table): cheapest, but keeps identity and revision mixed and still duplicates content per revision. Rejected.
- **Migration all entities at once**: rejected — the blast radius spans publishing, scheduling, SEO, and every public query for six entities. The pilot deliberately touches only `Page`, which has the fewest external relationships (only `Seo` and `User`).
- **Inlining SEO into the version**: rejected for the pilot — keeping `Seo` a separate one-to-one entity preserves the existing SEO UI and migration risk. The pilot informs whether the next entities should inline it.
- **Slug history / redirects**: out of scope. The stable slug already preserves public URLs across content revisions; changing a slug updates the root with no manual redirect handling in this pilot.

## Consequences

- Admin page lists show one row per logical page (the root), not one row per revision; version history is a per-root list.
- Concurrency is safe: publish/unpublish/edit serialize on the root row lock, so two publishers cannot leave the root with two live revisions.
- The same split is intended for `Post`, `Product`, `Category`, `Tag`, `ProductCategory`, and `Seo`; those migrations should follow once this pattern is exercised in production.
- The cut-over migration is destructive and one-way: after it runs, rolling back to the legacy table means restoring from a database backup that predates the deploy.
