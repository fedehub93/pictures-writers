# Site layout preview in the page builder

## Goal

While editing a Page in the Puck page builder, see the Header and Footer regions around it, read-only, at the selected Breakpoint — so the author judges the page as a visitor will, without merging the Page document and the Site region documents.

## Background

- The public layout (`src/app/(home)/layout.tsx`) renders the two live Site regions around `<main>`. The page builder renders only the Page document: `PageBuilderView` → `PuckEditor` → the page `config`.
- Puck 0.23 draws the canvas in an **iframe** whose width is exactly the selected Breakpoint (`iframe.enabled` defaults to true; `builder.tsx` sizes the container). Media queries inside the canvas read the canvas width, not the admin window. The only place where a header/footer behaves like the published site is therefore **inside the canvas**: a chrome rendered next to `<Puck.Preview />` would always look desktop.
- `Render` from Puck creates its own context with `isEditing: false`, `dragRef: null` and its own `metadata`, so a second Puck tree inside the canvas is read-only by construction and cannot be dragged.
- Root render props receive `puck.metadata` — the channel `Brand` already uses to preview Installation details (`src/puck/blocks/Brand/index.tsx`).
- The page builder route is a server component (`.../pages/[rootId]/builder/page.tsx`) that already prefetches the Page; the Site region reads are server-only.
- Terminology: see `CONTEXT.md` "Site layout preview" and "Editor root".

## Decisions

1. **Chrome inside the canvas**, through a page-editor-only root. The public page render config (`rootRenderConfig`) and the region editors are not touched, so the feature cannot change the published site.
2. **Read-only.** The chrome is wrapped in semantic `<header>` / `<footer>` elements, has no `data-puck-component` wrapper, and does not receive pointer events. There is no in-canvas editing and no "edit header" overlay.
3. **What is shown.** Per region: the **current version** when it differs from the live one (draft), otherwise the **live version**, and the code default (`default-regions.ts`) when the region has never been published. Users without `site_layout.read` get the live version or the default, never a draft.
4. **Links are resolved for display only.** The shown document is a clone with SmartLinks resolved (`resolveSmartLinksInPuckData`) and forms hydrated (`hydratePuckForms`). The stored draft document is never modified.
5. **Toggle in the editor header bar**, default on, not persisted. It lives next to the existing history/zoom controls in `BuilderHeader`.
6. **Sticky only outside editing.** The chrome `<header>` gets the sticky class only when `puck.isEditing` is false (e.g. a preview surface), never in the editing canvas, where a pinned header would cover the block being edited.
7. **Canvas design tokens.** The chrome wrapper applies the same `CANVAS_TOKENS` used by `renderRoot` (spacing, radius, canvas font), so the regions measure like the public page instead of the admin shell.
8. **A status chip next to the page title** names the regions that are not live (draft or default), so "draft" is never mistaken for "published".
9. **No "View on site" button** in this effort (decided out; the draft route already exists and can be added later).

## Data flow

```
builder/page.tsx (server)
  ├─ requireAdminAuth()                       (existing)
  ├─ prefetchPageById(rootId)                 (existing)
  └─ getSiteLayoutPreview(session)            (new, server-only)
       ├─ HEADER/FOOTER: draft vs live vs default
       ├─ hydrate forms + resolve links (clone)
       └─ per-region state: "live" | "draft" | "default"
            ↓ props
  PageBuilderView (client)
       ↓ siteLayout
  PuckEditor → <Puck metadata={{ ...metadata, siteLayout }}>
       ↓ puck.metadata
  PageEditorRoot (page config only)
       ├─ <header>{<Render config={headerChrome} data={header} metadata />}</header>
       ├─ existing page root wrapper (children)
       └─ <footer>{<Render config={footerChrome} data={footer} metadata />}</footer>
```

## Tickets

| # | Ticket | Depends on |
| - | ------ | ---------- |
| 01 | Canvas site layout chrome | — |
| 02 | Site layout status chip | 01 |

## Out of scope / follow-ups

- A neutral page skeleton in the Header/Footer region editors, so the region is judged in context (mirror feature; deliberately separate).
- Live refresh of the shown regions while the builder stays open (the preview is read at page load).
- "View on site" button toward the `(home)` draft route.
- Lazy-loading the region block renderers out of the page editor chunk.

## Verification

- `npx tsc --noEmit`, targeted ESLint, `npm run test:run`, `npm run build`.
- Manual: open a Page whose header/footer are live, draft and never published; check all three states at desktop/tablet/mobile; toggle the chrome off and back; confirm the public site and the draft route still render identically.
