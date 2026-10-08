# Spec: Introduce Root + Version versioning for Page (pilot)

## Problem Statement

The CMS currently uses a single-table versioning model: every version of a content item is a separate row in the same table, distinguished by `rootId`, `version`, `status`, and `isLatest`. This worked well for the first phase of the product, where the main goal was simply to let editors edit a published post without immediately changing the live site.

As the platform grows into a more generic, sellable CMS, this model is showing structural limits:

- **Data duplication**: every version duplicates large fields such as `tiptapBodyData`, `puckData`, and all relational child data.
- **Fragile external relationships**: orders, reviews, FAQs, galleries, and taxonomy links point to specific version rows instead of the logical content root.
- **Ambiguous queries**: `isLatest` is overloaded between "current draft" and "live published version", making reads error-prone.
- **Inconsistent implementations**: Post, Product, Category, Tag, and Page each implement the versioning dance slightly differently.
- **Concurrency gaps**: only Post publication uses row-level locking; other entities are exposed to race conditions.

We need a versioning architecture that is robust, consistent across content types, and able to support full version history, rollback, and stable public URLs. Rather than migrating every entity at once, we will validate the new pattern on the simplest entity first.

## Solution

Introduce a **Root + Version** model for the `Page` entity.

- `PageRoot` represents the logical page. It owns the stable identity (`id`), the stable slug, the first publication date, and all external relationships.
- `PageVersion` represents one revision of the page. It owns the mutable content (`title`, `puckData`, status, publication dates, user, SEO, cover image).
- `PageRoot` explicitly tracks two special versions:
  - `currentVersion` — the latest saved revision the editor is working on.
  - `liveVersion` — the revision currently visible on the public site.
- Public reads resolve a slug to the root, then fetch the live version.
- Admin reads work on the root and its version history.
- Publishing is an atomic operation that updates `liveVersionId` on the root under a row-level lock.

Once this pilot proves the pattern, the same structure will be applied to `Post`, `Product`, `Category`, `Tag`, `ProductCategory`, and `Seo`.

## User Stories

1. As an editor, I want to edit a published page without changing the live site, so that I can prepare and review changes safely.
2. As an editor, I want to publish the current draft of a page, so that it becomes the live version atomically.
3. As an editor, I want to unpublish the live version of a page, so that visitors no longer see it while I keep my draft.
4. As an editor, I want to see the list of previous versions of a page, so that I can audit what changed over time.
5. As an editor, I want to restore an older version as the current draft, so that I can roll back a mistake without losing history.
6. As a site visitor, I want a page URL to remain stable even when editors change the slug, so that bookmarks and search rankings are preserved.
7. As a developer, I want the new versioning pattern validated on a simple entity first, so that I can apply it confidently to more complex entities like posts and products.
8. As a developer, I want existing pages migrated automatically to the new schema, so that no live content is lost or broken.
9. As an editor, I want page publishing to be safe when two people publish at the same time, so that the live version cannot end up in an inconsistent state.
10. As a back-office user, I want the page list to show one row per logical page rather than one row per version, so that the admin UI stays readable.
11. As a developer, I want the public page query to resolve directly from the live version reference, so that the query path is simple and fast.
12. As an editor, I want SEO settings to be part of the version I am editing, so that SEO changes can also be prepared and published together with content changes.

## Implementation Decisions

- **Pilot entity**: `Page` was chosen because it has the fewest external relationships (only `Seo` and `User`), making it the safest place to validate the Root + Version pattern.
- **Root table**: `PageRoot` contains `id`, `slug` with a unique constraint, `firstPublishedAt`, `createdAt`, `updatedAt`, `currentVersionId`, and `liveVersionId`.
- **Version table**: `PageVersion` contains `rootId`, `version` (sequential integer), `status`, `title`, `puckData`, `publishedAt`, `scheduledAt`, `userId`, `seoId`, and `imageCoverId`.
- **Slug ownership**: the slug lives on the root. Changing a slug means updating the root. Manual redirect handling is out of scope for this pilot.
- **SEO ownership**: the `Seo` model remains a separate entity and is linked one-to-one to a `PageVersion`. This preserves the existing SEO UI and minimizes migration risk. The pilot will inform whether SEO should be inlined into each content Version for the next entities.
- **Version numbering**: versions are integers scoped to the root, incremented when creating a new revision from a published page. Draft edits update the current version in place without creating a new row.
- **Concurrency**: publish acquires a row-level lock on `PageRoot` before updating `liveVersionId`, preventing race conditions between concurrent publishers.
- **Migration strategy**: a backfill script creates one `PageRoot` for every existing `rootId` group in the old `Page` table, moves each old row into a `PageVersion`, and sets `currentVersionId` and `liveVersionId` based on `isLatest` and `status`.
- **API changes**: `pagesRouter` procedures are updated to read and write through the root/version tables. Public queries resolve `slug -> PageRoot -> liveVersion`.
- **UI changes**: the admin page list shows roots; the editor loads the current version; the publish action promotes the current version to live.
- **Testing**: new integration tests are added on `pagesRouter`, modeled on the existing `products-router.test.ts`, covering creation, editing, publishing, unpublishing, concurrent publish, version history, and migration correctness.

## Testing Decisions

- Tests will exercise the `pagesRouter` as the primary seam, because it covers schema, API, and business logic in one boundary.
- Tests will be integration-style: real database, real procedures, no mocking of Prisma.
- Prior art: `src/modules/shop/products/__tests__/products-router.test.ts` provides the pattern for testing versioning behavior.
- Key scenarios to cover:
  - Creating a page produces a root and a version 1 draft.
  - Editing a draft updates the current version in place.
  - Editing a published page creates a new `CHANGED` version while the live version remains unchanged.
  - Publishing promotes the target version to `liveVersion`.
  - Two concurrent publish calls leave the root in a consistent state.
  - Public read by slug returns the live version.
  - Migration backfill correctly reconstructs roots and versions from old data.

## Out of Scope

- Slug redirect / URL history table.
- FAQ and gallery versioning (not applicable to Page in the current model).
- Applying Root + Version to entities other than `Page`.
- Visual diff between versions.
- Full audit timeline UI beyond a simple version list.
- Bulk migration of other content types.

## Further Notes

- This pilot intentionally leaves `Seo` as a separate model linked to the Version. If the pattern feels awkward after implementation, the next entity migration may inline SEO fields directly into the Version table.
- `PageEditorType` and `PuckData` stay on the Version because they are part of the mutable content.
- The migration must be idempotent and reversible until the final cut-over ticket, so the production deployment can be rolled back if issues arise.
