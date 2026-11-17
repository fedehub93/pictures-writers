---
Status: resolved
Type: task
---

# Canvas site layout chrome

## Goal

Draw the Header and Footer regions around the Page in the page editor canvas, read-only and at the exact canvas width, fed by the current (or live) Site region documents, behind a session toggle.

## Acceptance criteria

- [x] With the toggle on (default), the Page builder canvas draws the Header region above the page content and the Footer region below it, inside the same iframe and at the same width as the page, at every Breakpoint (desktop, tablet, mobile).
- [x] The chrome is not selectable, draggable or editable: no `data-puck-component` wrapper is added and pointer events do not reach it.
- [x] The chrome is drawn inside semantic `<header>` and `<footer>` elements; the page content keeps its existing root wrapper unchanged.
- [x] The toggle lives in `BuilderHeader` and switches the chrome for the current editing session; the default is on and the choice is not persisted.
- [x] Per region, the document shown is: the current version when it differs from the live one, otherwise the live version, and the code default when the region has no live version. A user without `site_layout.read` never receives a draft.
- [x] SmartLinks in the shown document are resolved and forms hydrated for rendering only; the stored draft document is not mutated.
- [x] The chrome wrapper applies the canvas design tokens (`--spacing`, `--radius`, canvas font) and passes the Installation `metadata`, so `Brand` renders the site name/logo exactly as in the region editor.
- [x] The sticky class is applied to the chrome `<header>` only when `puck.isEditing` is false; the editing canvas never pins the header.
- [x] The public layout, the `(home)` draft route, the region editors and the Page preview are unchanged: no new markup, no new query, same HTML.
- [x] A Page with no region rows, never-published regions or `puckData: null` renders the defaults without throwing.
- [x] Tests: the page-editor root renders chrome when the toggle is on and nothing when off; the chrome tree receives `isEditing: false` and metadata; the public root render never emits chrome; `npx tsc --noEmit`, targeted ESLint, `npm run test:run`, `npm run build` pass.

## Implementation notes

- **Do not reuse `region/render-config.ts`.** It imports the public renderers (`BrandServer`, `NavbarBlockServer`, `CopyrightServer`) which are `server-only`, so it cannot enter the page editor bundle. Use the editor configs.
- **Circular-import trap.** `region/editor-config.tsx` imports `editorComponentConfigs` from `puck/config.ts`. Importing `editorConfigForRegion` back into `config.ts` creates a cycle. Build the two chrome configs inline in `config.ts` with `pickComponentConfigs(HEADER_REGION_COMPONENTS | FOOTER_REGION_COMPONENTS, editorComponentConfigs)` and the matching root (`HeaderRootEditor` for the header), or pass them through a factory in `puck/root/`.
- **Page-only root.** Add `src/puck/root/page-editor.tsx` exporting a page-editor root (fields = `RootEditor.fields`, render = a wrapper around `renderRoot`). Wire it only in `puck/config.ts`; `rootRenderConfig` and `editorConfigForRegion` stay as they are.
- **Toggle.** Extend `use-editor-store` with `showSiteLayout` (default `true`) and a setter. The root render reads it with the store hook; Zustand is shared across the iframe portal because it is the same React tree.
- **Data.** New server query, e.g. `src/modules/site-regions/server/queries/get-site-layout-preview.ts`, returning `{ header, footer }`, each `{ data: Data | null, state: "live" | "draft" | "default" }`. Draft comes from `getRegionWithVersions` (current version), live from `getLiveRegionByKey(key, { resolveLinks: true })`, default from `default-regions.ts`. Clone + resolve links with `resolveSmartLinksInPuckData`, hydrate forms with `hydratePuckForms`. Decide draft vs live with `hasPermission` on `site_layout.read`.
- **Transport.** `PuckEditor` gains an optional `siteLayout` prop and merges it into `metadata`; `PageBuilderView` receives it as a prop from the route. Keep the existing `metadata` contract intact (region editors keep passing site name/logo only).
- **Canvas tokens.** `CANVAS_TOKENS` is local to `root/render.tsx`. Export it (or move it to a small shared module) so the chrome wrapper can apply the same overrides. Do not apply them to the page root twice.
- **Sticky.** Reuse `isHeaderSticky` / `HEADER_STICKY_CLASS_NAME` from `src/modules/site-regions/lib/header-sticky.ts` (pure module, no server imports) on the chrome `<header>`.
- **No new element in the page path.** The chrome lives only in the editor root render, so the published page keeps exactly the markup it has today.

## Out of scope

- The status chip (ticket 02).
- "View on site", live refresh, region skeletons, bundle splitting.

## Comments

Delivered in `36437c60` (`feat(puck): preview site layout around the page builder canvas`).

- Page-only root: `src/puck/root/page-editor.tsx` exports `createPageEditorRoot({ header, footer })` and `PageEditorRootUi`; it draws `<header>` and `<footer>` around the unchanged `PageRootContent`, so the published page path still uses `renderRoot` with no new markup.
- Chrome palettes: built inline in `src/puck/config.ts` with `pickComponentConfigs(HEADER_REGION_COMPONENTS | FOOTER_REGION_COMPONENTS, editorComponentConfigs)` and the matching `HeaderRootEditor` / `RootEditor`, avoiding the `region/editor-config.tsx` cycle. The page palette is untouched.
- Read-only by construction: each region is rendered by a second `<Render>` tree (`isEditing: false`, own metadata, no `data-puck-component`), wrapped in `pointer-events-none select-none`.
- Toggle: `showSiteLayout` (default `true`, not persisted) in `use-editor-store`; the page editor reads it from the root render, and `BuilderHeader` shows the button only when it is not a region editor.
- Data: `src/modules/site-regions/server/queries/get-site-layout-preview.ts` returns `{ header, footer }` with `state: "live" | "draft" | "default"`. The current version is only read when `hasPermission(..., site_layout.read)`; never-published regions and null documents use `getDefaultRegionPuckData`. Draft documents come from `getRegionWithVersions` (already cloned/hydrated) and are cloned again by `resolveSmartLinksInPuckData` for rendering only, so the stored draft is unchanged.
- Tokens and metadata: `CANVAS_TOKENS` is exported from `root/render.tsx` and applied to both region wrappers; `PuckEditor` merges `siteLayout` into the existing `puck.metadata`, and the builder route adds the Installation site name/logo.
- Sticky: `getHeaderClassName` is applied only when `puck.isEditing` is false, so the editing canvas never pins the header.
- Tests: `src/puck/__tests__/page-editor-root.test.tsx` (on/off, semantic elements, no `data-puck-component`, read-only context + metadata, tokens, sticky, page-root default, public-root isolation) and `src/modules/site-regions/server/__tests__/get-site-layout-preview.test.ts` (live, draft, default, permission gate, link resolution, form hydration, null document).

Verified: `npx tsc --noEmit` clean; targeted ESLint 0 errors (the pre-existing `exhaustive-deps` warning in `PageBuilderView` remains); `npm run test:run` 236 files / 1954 tests passed; `npm run build` passed.
