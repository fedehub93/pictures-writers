# Spec: Root + Version for Post

## Problem Statement

`Post` is the last large blog entity still on the legacy single-table versioning
model: every revision is a row distinguished by `rootId`, `version`, `status`,
and `isLatest`, and the root is one of its own rows. That model conflates
identity with revision, overloads `isLatest` between "current draft" and "live
version", duplicates the content and every editorial relation (`PostCategory`,
`Tag`, `PostAuthor`, `Faq`, `Seo`) per revision, and forces a two-phase
`distinct rootId` query in the admin list. The versioning rules are spread
across `create-new-version.ts`, `publish-post.ts`, and `schedule-post.ts`, and
have already drifted.

`Page` validated the Root + Version pattern (ADR 0011) and `Category`/`Tag`
left versioning entirely (ADR 0012). `Post` is the first *complex* entity to
adopt Root + Version: it carries authors, taxonomy links, FAQs, scheduling,
and inbound external references. Migrating it closes the blog.

## Solution

`Post` becomes `PostRoot` + `PostVersion`.

- `PostRoot` is the logical post. It owns `id`, a unique `slug`,
  `firstPublishedAt`, `currentVersionId`, `liveVersionId`, `createdAt`,
  `updatedAt`. It is the target of every inbound external reference
  (ads, scheduler, widgets).
- `PostVersion` is one revision. It owns the mutable content and every
  editorial relation: `title`, `description`, `bodyData`, `tiptapBodyData`,
  `imageCoverId`, `status`, `publishedAt`, `scheduledAt`,
  `preSchedulingStatus`, `userId`, `seoId`, plus `categories`, `tags`,
  `authors`, `faqs`, and a `version` integer scoped to the root. `Seo` stays a
  separate one-to-one entity linked to the version.
- Public reads resolve `slug → PostRoot → liveVersion`; the draft preview reads
  the current version. Admin reads work on the root's current version.
- Editing a non-live current version updates it in place; editing the live
  version forks a new `CHANGED` version. Publishing locks the root, demotes the
  previous live version to `CHANGED`, promotes the target to `PUBLISHED`, and
  updates `liveVersionId`; `firstPublishedAt` is written on the root only at
  first publication.
- The migration is a **one-shot split**: create the new tables, move each
  legacy row into a `PostVersion` (reusing row ids) under a `PostRoot` (reusing
  the `rootId`), repoint the editorial relations and SEO, resolve slug
  collisions deterministically, then drop the legacy `Post` table. Because it
  reuses the `rootId` as `PostRoot.id`, external references need no rewrite.
- The admin default ordering is preserved — unpublished posts first, then
  `publishedAt` desc, then `title`, then `id` — by sorting one row per root in
  memory after a single `findMany`; explicit column sorts stay supported.

## User Stories

1. As an editor, I want to edit a published post without changing the live
   site, so that I can prepare changes safely.
2. As an editor, I want to publish the current version atomically, so that the
   live site flips in one step.
3. As an editor, I want categories, tags, authors, and FAQs to be part of the
   version I am editing, so they publish together with the content.
4. As an editor, I want scheduled publication to keep working, so that a post
   goes live at the chosen time.
5. As an editor, I want the post list to show one row per logical post, with
   the unpublished (work-in-progress) ones first, so that I see what needs
   attention.
6. As a site visitor, I want post URLs to stay stable across edits, so that
   bookmarks and rankings are preserved.
7. As a developer, I want Post out of the legacy model, so that only `Product`
   and `ProductCategory` remain, and the two-phase list query is gone.
8. As a developer, I want existing posts (241 articles, several versions each)
   migrated automatically and without data loss.

## Implementation Decisions

- **Schema**: `PostRoot` (`id` reusing the legacy `rootId`, `slug @unique`,
  `firstPublishedAt?`, `currentVersionId @unique`, `liveVersionId? @unique`,
  timestamps) and `PostVersion` (`rootId` cascade, `version`, `status`, the
  content fields, editorial relations, SEO) with `@@unique([rootId, version])`.
  The legacy `Post` model, its self-relation, and `@@index([rootId])` are
  dropped.
- **Stable identity**: `slug` moves to the root and gains `@unique`; the
  migration resolves existing collisions with a deterministic numeric suffix.
- **Editorial ownership**: `PostCategory`, `PostAuthor`, `Faq`, the `Tag` m2m,
  and `Seo` hang off `PostVersion`, so they draft and publish atomically with
  the content. The join models keep their names; the relation fields on the
  version are `categories` and `authors` (renamed from `postCategories` /
  `postAuthors`), and the inverse relations on `User`/`Seo`/`Media` become
  `postVersions`.
- **Version numbering**: integers scoped to the root; a fork takes
  `max(version) + 1`.
- **Concurrency**: publish/unpublish/schedule serialize on a row-level lock on
  `PostRoot`, via a shared root-lock helper extracted with `Page`.
- **Scheduler**: `ScheduledAction` keeps `targetType = POST_ROOT` and
  `targetId = PostRoot.id`; the handler promotes the scheduled (current)
  version to live.
- **List ordering**: a single `findMany` over `PostRoot` (with its current
  version); the default order reuses a generalized version-agnostic comparator;
  explicit sorts (`title`, `status`, `publishedAt`, `scheduledAt`, `createdAt`,
  `updatedAt`) are supported. The `distinct rootId` two-phase query and
  `src/shared/lib/list-sorting.ts`'s Post-specific path are removed.
- **Public reads**: `getPublishedPostBySlug` → root by slug → live version;
  draft reads → current version.
- **No history UI**: `getVersions(root)` is added for parity with `Page`;
  version-history and rollback UI are out of scope.

## Testing Decisions

- Tests exercise the `postsRouter` as the primary seam, integration-style
  against the real database (no Prisma mocking), modeled on
  `src/modules/pages/server/__tests__/page-root-version.test.ts`.
- Key scenarios:
  - Creating a post produces a root and a `DRAFT` version 1.
  - Editing a draft updates the current version in place; editing a published
    post forks a new `CHANGED` version while the live version is unchanged.
  - Publishing promotes the target version to `liveVersion` under a lock.
  - Two concurrent publish calls leave the root consistent.
  - Unpublishing clears `liveVersionId` and demotes the version to `CHANGED`.
  - Scheduling sets `SCHEDULED` on the current version and creates a
    `ScheduledAction` targeting the root; the handler publishes it.
  - Deleting a root cascades versions, editorial relations, and its SEO.
  - `getMany` returns one row per post with the default "unpublished first,
    then `publishedAt` desc" order and supports explicit sorts.
  - Public `getPublishedPostBySlug` returns the live version.
  - The migration reconstructs one root per logical post, reuses ids, repoints
    links, and resolves slug collisions.

## Out of Scope

- Migrating `Product` or `ProductCategory`.
- Version-history or rollback UI.
- Slug redirects / URL history for posts.
- Soft delete / restore for posts.
- Changing scheduling semantics or the automation engine.
- Reordering the `ContentStatus` enum for DB-side ordering.

## Further Notes

- The blog becomes fully migrated; the `content-versioning-debt` note drops
  `Post` and the two-phase workaround is gone.
- Because it reuses ids and has no dual-write, the cut-over is one-way; rollback
  means restoring a pre-deploy backup. The migration is guarded on the legacy
  `rootId` column so re-running it is a no-op.
- The decision is recorded in ADR 0013; `CONTEXT.md` defines *Post*, *Post
  version*, and the corrected *Root*/*Version* terms.
