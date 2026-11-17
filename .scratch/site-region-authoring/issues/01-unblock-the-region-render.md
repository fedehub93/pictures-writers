---
Status: done
Type: task
Blocked by:
---

# Unblock the region render

## Goal

Make the published Header region render without throwing, and stop the region editor from closing the admin sidebar.

## Acceptance criteria

- [x] A Header region containing a Top bar renders on the public site: no "Functions cannot be passed directly to Client Components" error.
- [x] The admin sidebar can be opened from the Site region editor and stays open.
- [x] `npx tsc --noEmit` and the Puck + Site region test suites pass.
- [x] The Iubenda script warning is triaged and recorded as separate from this defect.

## Implementation notes

- **Top bar / slot boundary.** `TopBarBlockUi` is a client component (`src/puck/blocks/TopBar/ui/top-bar.tsx`), and `renderTopBarBlock` passed it the slot component itself (`Content={Content}`). A Slot is a function, so the server render of a region could not serialize it. The block render now renders the slot (`<Content className="puck-top-bar-slot min-w-0 w-full" />`) and hands it over as `children`; `TopBarBlockUiProps.children` is a `ReactNode`. The slot stays a direct child of `.puck-top-bar`, so the `:has(> .puck-top-bar-slot:empty)` rule is unchanged. This was the only block passing a Slot into a client component.
- **Sidebar effect.** `SiteRegionEditorView` collapsed the admin sidebar with an effect that depended on `[setOpen]`; `setOpen` changes identity every time `open` changes, so every attempt to open the sidebar re-ran the effect and scheduled another close 50 ms later. The effect is now mount-only, with a comment explaining why, matching `PageBuilderView`.
- **Iubenda.** The console warning about a `<script>` rendered in a component comes from the raw Iubenda tags in the shared `<head>` (`src/app/(home)/_components/public-head-scripts.tsx`), not from the header and not from this defect. It is pre-existing and its fix touches consent ordering (ADR-0031), so it stays out of this effort.

## Verification

- `npx tsc --noEmit` clean.
- `npm run test:run -- src/puck src/modules/site-regions`: 28 files / 214 tests pass.
