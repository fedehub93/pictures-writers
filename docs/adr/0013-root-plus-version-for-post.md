# Split the Post model into PostRoot + PostVersion

**Status**: accepted

The `Post` entity still used the legacy single-table versioning model: every revision was a row distinguished by `rootId`, `version`, `status`, and `isLatest`, with the root being one of its own rows. That conflates identity with revision, overloads `isLatest` between "current" and "live", duplicates content and every editorial relation per revision, and forced a two-phase distinct-root `getMany`. ADR 0011 validated the Root + Version pattern on `Page`; ADR 0012 took taxonomy out of versioning. `Post` is the first complex entity (authors, taxonomy links, FAQs, scheduling, external references) to adopt the pattern.

We introduce **Root + Version** for `Post`:

- `PostRoot` is the logical post. It owns the stable, unique `slug`, `firstPublishedAt`, `createdAt`/`updatedAt`, and the two pointers `currentVersionId` and `liveVersionId`. Inbound references (`AdItem.postRootId`, `AdBlock.excludedPostIds`, `ScheduledAction.targetId`, `Widget.metadata`) keep pointing at its id, which reuses the legacy `rootId`.
- `PostVersion` is one revision. It owns the mutable content and every editorial relation — `title`, `description`, `bodyData`/`tiptapBodyData`, `imageCoverId`, `status`, `publishedAt`, `scheduledAt`, `preSchedulingStatus`, `userId`, `seoId`, plus `categories`, `tags`, `authors`, `faqs` — and a `version` integer scoped to its root. `Seo` stays a separate one-to-one entity on the version.
- Public reads resolve `slug → PostRoot → liveVersion`; the draft preview reads the current version. Admin reads work on the root's current version.
- Publishing acquires a row-level lock on the root, demotes the previous live version to `CHANGED`, promotes the target to `PUBLISHED`, and updates `liveVersionId`; `firstPublishedAt` is written on the root only at first publication. Editing a non-live current version updates it in place; editing the live version forks a new `CHANGED` version.
- The migration is a **one-shot split**: it creates the new tables, moves every legacy row into a `PostVersion` (reusing row ids) under a `PostRoot` (reusing the `rootId`), repoints `PostCategory`/`PostAuthor`/`Faq`/`Seo`, resolves slug collisions deterministically, then drops the legacy `Post` table. There is no dual-write phase; rollback means restoring a pre-deploy backup.

## Considered options

- **Backfill + dual-write + cut-over (the Page pilot shape)**: rejected. The pattern is already proven in production on `Page`, and the root ids can be reused, so dual-write would only add a second write surface across create/edit/publish/schedule for no new information.
- **Keeping taxonomy links on the root** instead of the version: rejected. Category, tag, author, and FAQ changes should be drafted and published atomically with the content; putting them on the root would leak in-progress edits to the live site.
- **Inlining SEO into the version**: rejected for parity with `Page`; revisit when `Product`/`ProductCategory` migrate.
- **DB-side default ordering via reordering the `ContentStatus` enum** so `ORDER BY status` means "unpublished first": rejected. It changes the ordinal semantics of a shared enum for `Product`/`ProductCategory`; the blog list sorts one row per post in memory instead, which preserves the exact ordering at current and foreseeable volumes.

## Consequences

- The blog admin list shows one row per logical post (the root); the two-phase distinct-root `getMany` disappears.
- `PostCategory`, `PostAuthor`, `Faq`, `Seo`, and the `Post ↔ Tag` join now hang off `PostVersion`; the join models keep their names, and the inverse relations on `User`/`Seo`/`Media` are renamed to `postVersions`.
- The scheduler is unchanged in shape: `ScheduledAction.targetType = POST_ROOT` and `targetId = PostRoot.id`, promoting the scheduled version to live.
- External references keep working because `PostRoot.id` reuses the legacy `rootId`; `Widget.metadata.posts[].rootId` keeps its key and now names a `PostRoot.id`.
- The cut-over is destructive and one-way: rolling back means restoring a database backup that predates the deploy. Only `Product` and `ProductCategory` remain on the legacy model.
