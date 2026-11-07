# Site regions: global header and footer

## Goal

Allow each Installation to edit and publish its own **header** and **footer** as shared Site regions, managed through the Puck page builder, while keeping the existing static Pictures Writers components as fallback during the transition.

## Background

Today the public layout (`src/app/(home)/layout.tsx`) hard-codes a `<Navbar />` and `<Footer />` component. The navbar contains an announcement bar, logo, big-menu navigation, search and mobile sheet. The footer is a static three-column link footer branded for Pictures Writers.

The CMS is meant to become generic and multi-tenant (one Installation per customer). Each Installation must be able to compose its own header/footer without code changes.

## Terminology

See `CONTEXT.md` "Site layout" for canonical terms:

- **Site region**: shared public layout area (header, footer), versioned and published like a Page.
- **Header region**: top Site region, composed with Puck blocks.
- **Footer region**: bottom Site region.
- **Announcement bar**, **Brand block**, **NavbarBlock**, **Link list**: Puck blocks.

## Architecture decisions

1. **New `SiteRegion` table** with root + version, mirroring `PageRoot`/`PageVersion`.
   - Why: global regions have the same risk profile as pages (one mistake affects every page) and deserve versioning, publish/unpublish and history.
   - Rejected: special `Page` slugs (`__header__`) would pollute the pages table and semantics; `Widget` is not versioned.

2. **One row per region key per Installation**.
   - `SiteRegion.key` is an enum (`HEADER`, `FOOTER`). Future regions require a migration.

3. **Announcement bar is a Puck block inside the Header region**, not a separate Site region for the first iteration.

4. **NavbarBlock owns its own typed JSON menu tree**, not generic Puck children. This keeps responsive rendering deterministic and makes the big-menu/mobile fallback tractable.

5. **Link resolution is server-side**. Blocks that reference CMS entities (page, post, product, category) receive the resolved URL at render time.

6. **Existing static `Navbar`/`Footer` components are kept for now**. The layout reads published Site regions; if a region is missing, a generic default is rendered. The static components will be removed only after Pictures Writers has recreated its header/footer in production.

## Data model

```prisma
enum SiteRegionKey {
  HEADER
  FOOTER
}

enum ContentStatus {
  DRAFT
  CHANGED
  PUBLISHED
  SCHEDULED
}

model SiteRegion {
  id   String        @id @default(uuid())
  key  SiteRegionKey @unique

  firstPublishedAt DateTime?

  currentVersion   SiteRegionVersion? @relation("SiteRegionCurrentVersion", fields: [currentVersionId], references: [id], onDelete: SetNull)
  currentVersionId String?            @unique

  liveVersion   SiteRegionVersion? @relation("SiteRegionLiveVersion", fields: [liveVersionId], references: [id], onDelete: SetNull)
  liveVersionId String?            @unique

  versions SiteRegionVersion[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model SiteRegionVersion {
  id String @id @default(uuid())

  version Int

  status   ContentStatus @default(DRAFT)
  /// [PuckData]
  puckData Json?         @db.JsonB

  root   SiteRegion @relation(fields: [rootId], references: [id], onDelete: Cascade)
  rootId String

  user   User?   @relation(fields: [userId], references: [id], onDelete: SetNull)
  userId String?

  publishedAt DateTime?
  scheduledAt DateTime?

  currentForRoot SiteRegion? @relation("SiteRegionCurrentVersion")
  liveForRoot    SiteRegion? @relation("SiteRegionLiveVersion")

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([rootId, version])
  @@index([rootId])
  @@index([status, scheduledAt])
}
```

> Reuse the existing `ContentStatus` enum if it already covers `DRAFT/CHANGED/PUBLISHED/SCHEDULED`; otherwise create a dedicated `SiteRegionStatus` enum.

## Server layer

New module: `src/modules/site-regions/`

- `server/procedures.ts` — tRPC router `siteRegions`:
  - `getByKey({ key })` — returns the live version for a region, or `null`.
  - `getCurrent({ key })` — returns the current (draft/editable) version.
  - `getVersions({ key })` — list version history.
  - `create({ key })` — create a root and an initial draft if it does not exist.
  - `update({ id, rootId, puckData })` — save the current version, forking if it is the live version.
  - `publish({ id, rootId })` — promote a version to live.
  - `unpublish({ key })` — clear `liveVersionId`.

- `server/queries/get-live-region-by-key.ts` — lightweight server-side query used by the public layout.
- `server/queries/get-region-with-versions.ts` — admin list/detail query.
- `server/save-site-region.ts`, `server/publish-site-region.ts` — core domain functions, mirroring `src/modules/pages/server/save-page.ts` and `publish-page.ts`.
- `server/resolve-menu-links.ts` — resolves `NavbarBlock` menu items that reference CMS entities to real URLs.
- `server/resolve-link.ts` — resolves a single smart link (page/post/product/category/external).
- `lib/default-regions.ts` — generic default `puckData` for `HEADER` and `FOOTER`.

## Public layout integration

In `src/app/(home)/layout.tsx`:

- Fetch `HEADER` and `FOOTER` live Site regions (server-side, with a short-term cache).
- If a region is missing, render the generic default from `lib/default-regions.ts`.
- Render the regions with `<PuckRender config={renderConfigForRegion(key)} initialData={region.puckData} />`.
- Keep the existing `<Navbar />` and `<Footer />` imports and render them **behind** the new regions? No — the goal is to replace them. During transition, use the static components only if explicitly requested by a feature flag, or keep them unused in source until removal. Recommended: keep the files but stop importing them in `layout.tsx`; the generic default is the fallback.

## Puck blocks

### Existing blocks to keep/reuse

- `Container`, `Flex`, `Grid`, `Separator`, `Image`, `Form`, `Heading`, `Icon`.

### New blocks

| Block | Purpose | Main props |
|-------|---------|------------|
| `Text` | Plain paragraph text, also usable in regular pages. | `text`, `align`, `color` |
| `LinkList` | Titled list of links, mainly for footer columns. | `title`, `links[]` |
| `Copyright` | Auto copyright line reading `siteName`/year from Settings. | `extraText`, `showYear` |
| `Brand` | Logo + site name from Settings, with overrides. | `showLogo`, `showSiteName`, `customText`, `customLogoUrl` |
| `AnnouncementBar` | Thin banner, dismissible optional. | `text`, `link`, `backgroundColor`, `dismissible` |
| `SearchBar` | Reuse existing public search UI as a Puck block. | `placeholder`, `variant` |
| `NavbarBlock` | Responsive navigation. | `items[]`, `layout` |

### Link model

Both `Link` block and `LinkList`/`NavbarBlock` links support:

```ts
type SmartLink =
  | { type: "external"; url: string; openInNewTab?: boolean }
  | { type: "page"; pageId: string }
  | { type: "post"; postId: string }
  | { type: "product"; productId: string }
  | { type: "category"; categoryId: string }
  | { type: "productCategory"; productCategoryId: string };
```

Resolution happens server-side when the region is fetched.

### Palette per region

The Puck editor must receive a different `config` per region so that users cannot drop a `NavbarBlock` inside the footer, for example.

- **Header palette**: `Container`, `Flex`, `Grid`, `Brand`, `AnnouncementBar`, `NavbarBlock`, `SearchBar`, `Heading`, `Text`, `Link`, `Image`.
- **Footer palette**: `Container`, `Flex`, `Grid`, `Heading`, `Text`, `Link`, `LinkList`, `Copyright`, `Image`, `Form`, `Separator`.
- **Page palette** (existing): unchanged; add `Text` and the enhanced `Link`.

## Admin UI

New admin area under `src/app/(admin)/site-regions/`:

- `page.tsx` — list of Site regions (header, footer) with status and publish state.
- `[key]/page.tsx` — editor for a specific region; uses the same Puck editor UI as pages but with the region-specific config.
- Layout uses the existing admin shell.

The backoffice menu gets a new item **Aspetto / Site layout** gated by the `site_layout` permission.

## Permissions

New backoffice area: `site_layout`.

- Actions: `read`, `update`, `publish`.
- By default `ADMIN` has all actions; `EDITOR` can also have `read`+`update`+`publish` in the initial seed.
- This is separate from `pages` so a customer can later give editors page access without letting them change the global layout.

## Revalidation

When a Site region is published or unpublished, invalidate the public layout so every page reflects the change:

```ts
revalidatePath("/", "layout");
```

The existing 24h ISR backstop remains as a safety net.

## Migration and default content

- Prisma migration creates `SiteRegion` and `SiteRegionVersion`.
- A seed or bootstrap step creates generic default `puckData` for `HEADER` and `FOOTER` only if no rows exist.
- The default header shows only the `Brand` block. The default footer shows only the `Copyright` block. No Pictures Writers branding.
- Existing static `Navbar`/`Footer` React components are **not deleted** in this phase; they remain in source for the production cutover.

## Open questions / future work

- Separate `ANNOUNCEMENT_BAR` Site region if scheduling/multi-bar becomes needed.
- Extract `NavigationMenu` to a reusable entity if the same menu must appear in header and footer.
- Add more region keys (`MOBILE_NAV`, `COOKIE_BANNER`, etc.).

## Acceptance criteria

- [ ] A backoffice user can open `/admin/site-regions`, see header and footer, and edit them in Puck.
- [ ] Publishing a region updates the public site without a full deploy.
- [ ] The footer can be recreated using only Puck blocks.
- [ ] The header supports an announcement bar, brand, navbar and search bar.
- [ ] The navbar renders a responsive menu: big menu on desktop, sheet/accordion on mobile.
- [ ] Links can point to CMS entities and are resolved at render time.
- [ ] A new Installation sees a generic default header/footer, not Pictures Writers content.
- [ ] Existing static `Navbar`/`Footer` components are still present in source after this work.
