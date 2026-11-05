# Site regions as first-class versioned entities

**Status**: accepted

The public header and footer were hard-coded React components. To let each Installation compose them in Puck, they need stored content with the same safety properties as a page: a draft the editor can keep working on, a published revision the public site renders, history, unpublish, and a change that reaches every page at once. We therefore store each one as a dedicated `SiteRegion` root plus `SiteRegionVersion` revisions, keyed by the `SiteRegionKey` enum (`HEADER`, `FOOTER`), and reuse the Root + Version contract established for `Page` (ADR-0011). `currentVersionId` points at the revision the editor is working on and `liveVersionId` at the revision the public layout renders; editing the live revision forks a `CHANGED` revision, publishing locks the root row, promotes the target and demotes the previous live version, and unpublishing clears the live pointer. `firstPublishedAt` lives on the root and is written only once. The key is unique because an Installation has exactly one header and one footer, and because each Installation owns its database (ADR-0036) that uniqueness needs no tenant column.

The public layout reads only the live version through `getCachedLiveRegionByKey`. When a region has never been published it renders a **generic default** from `lib/default-regions.ts` — a `Brand`-only header and a `Copyright`-only footer — so a fresh Installation never inherits Pictures Writers branding. The default is code, not seeded rows; a persisted region starts empty, and a *published empty document* is respected as a deliberate headerless or footerless site. A missing region is the only case that falls back.

Permissions are a separate `site_layout` area (`read`, `update`, `publish`), not part of `pages`. Editing the global layout has a larger blast radius than editing a page, and the split lets a customer grant page access without granting layout access. `ADMIN` and `EDITOR` receive all three actions in the initial seed, and the admin menu gates the new area on `site_layout.read`. Creating a root happens on the first editor open, so it resolves to `site_layout.update` rather than a `create` action.

A region renders in the layout of every page, so publishing or unpublishing calls `revalidatePath("/", "layout")` and `revalidateTag` on the region cache tag. The cached read has a short time-to-live as a backstop, on top of the same on-demand revalidation strategy as the rest of the site (ADR-0001).

## Considered options

- **Special `Page` rows with reserved slugs** (for example `__header__`). It would reuse the existing editor, versioning and publish flow. Rejected: those rows would surface in the page list, slug uniqueness, sitemap, search and generic page queries, so every consumer would need to exclude them; they compete for the public slug namespace; they are indistinguishable from real pages in the admin UI and easy to edit or delete; and the `pages` permission would implicitly grant control of the global layout. Their URL semantics are wrong too: a header is not a routable page.
- **Extend the `Widget` table**. Rejected: `Widget` is the dashboard widget registry, with code-defined types and no draft/publish lifecycle (ADR-0015). Making it carry a versioned, publicly rendered layout area would either force versioning onto dashboard widgets or turn `Widget` into two unrelated entities with different publication rules. A Site region shares its risk profile with a page, not with a dashboard tile.
- **Store the regions as JSON in `Settings`**. Cheapest schema change, but it has no revisions, no publish/unpublish, no row lock and no history, so concurrent saves overwrite each other and a bad edit is immediately global and unrecoverable. It also couples public layout content to the settings permission and its update path.
- **Dedicated `SiteRegion` root + versions keyed by an enum** (chosen). It gives the region the same versioning, locking and publication semantics as a page while keeping the identity set closed (a new region is a migration, not a free-form slug), and it isolates the permissions, the admin screens and the revalidation from pages and widgets. The cost is a new table pair, duplicated save/publish plumbing instead of sharing `Page`'s, and a migration whenever a future region key is added.

## Consequences

- Each new region key requires a Prisma enum migration. The closed set is intentional: regions are part of the application contract, unlike pages, whose slugs are content.
- The public layout performs one cached read per region on every request; publish and unpublish invalidate the cache tag and the layout path, so the change is visible without a deploy.
- The editor uses a per-region Puck palette, so header-only blocks such as `NavbarBlock` cannot be dropped into the footer and vice versa.
- The admin lists one row per region (the root) with its current and live status; history is a per-region version list.
- The static `Navbar` and `Footer` components remain in source but are no longer imported by the public layout. Removing them is a later cut-over after Pictures Writers has recreated its layout with Site regions; it is not part of this decision.
- The canonical terminology and boundaries are recorded in `CONTEXT.md` "Site layout"; the full feature scope is in `.scratch/site-regions/spec.md`.
