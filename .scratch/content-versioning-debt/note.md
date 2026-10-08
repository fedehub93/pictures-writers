# Note: content versioning debt

Status: known debt, deliberately deferred
Date: 2026-10-07

## Context

While adding server-side sorting to the admin lists (posts, blog categories, blog
tags, products) we had to reintroduce a way to select the *current version* of a
root. It was implemented as a two-phase query (`distinct rootId` with
`orderBy rootId asc, version desc` to get ids, then a sorted `findMany` on those
ids) in each `getMany` procedure. This works and is correct, but it is a
workaround over a versioning model that conflates several concepts.

This note records the debt so it is not lost; it is **not** a committed plan.

> Update (2026-10-08): `Page` has since moved to Root + Version (ADR 0011) and
> `Category`/`Tag` have left versioning entirely (ADR 0012). The debt below now
> concerns `Post`, `ProductCategory`, and `Product` only.

## The debt

The versioning model (a self-relation `rootId` + `version` + `status` + `isLatest`
on `Post`, `ProductCategory`, `Product`) has these smells:

- **Two concepts in one flag.** `isLatest` means "live/published version", but
  there is no explicit "current version" (the most recent one). Editing a
  published post creates a `CHANGED` version with `isLatest: false`, so
  `isLatest` cannot be used to represent an item in the backoffice.
- **Implicit state, invariants not enforced by the database.** "Exactly one
  `isLatest` per root", "exactly one current version", "one published version per
  root" are application rules scattered across the versioning/publish code.
- **The root is itself a version.** Identity and revision are mixed; publication
  dates are duplicated on every row instead of living on the identity.
- **`status` mixes entity lifecycle and revision state** (`CHANGED` is a
  revision property, `SCHEDULED` is a publication instruction).
- **Duplicated versioning logic per entity** (`create-new-version.ts` and the
  `publish` procedures), which drifts: e.g. `ProductCategory`/`Product` used to
  lose `firstPublishedAt` on a new version, and `Product` had no publication
  dates at all until now.

## Current workaround (what we shipped)

- `src/shared/lib/list-sorting.ts` builds the `orderBy` (whitelist + default
  `publishedAt desc nulls first, status asc, title asc, id asc`).
- Each admin `getMany` selects current-version ids first, then sorts/paginates a
  second query over `id in (...)`.

## Options to revisit, in order of cost

1. **Extract a single versioning layer** (low cost, no schema change): one shared
   function for "create new version" / "publish", used by every entity, so the
   rules stop diverging. Does not fix the modelling, but removes the drift.
2. **Split Entity from Revision** (high cost, invasive): a stable `Entity`
   (id, slug, owner, SEO) and `Revision` rows (content snapshot, `version`,
   `createdAt`, `publishedAt`), with explicit pointers on the entity
   (`currentRevisionId`, `publishedRevisionId`). Lists then join on the pointer
   (no `distinct`, no ambiguous flag), invariants become two foreign keys, and
   publication dates live once. Touches publishing, scheduling, SEO and all
   public queries for six entities.
3. **Explicit revision-state fields** (medium, a middle ground): add
   `isCurrentVersion` (latest version) and `isPublishedVersion`, maintained in
   the versioning paths and backfilled. Clean queries, but requires a data
   migration.

## Why deferred

Option 2 is not justified by the problem that triggered this work. Option 3 was
explicitly rejected for now to avoid a data migration. The two-phase query is
correct and adequate at current list sizes.

## Revisit when

- Admin lists grow enough that reading one id per matching root becomes a
  measurable cost, or
- a third entity needs versioning, or the versioning rules diverge again, or
- the CMS makes revision history a user-facing feature.
