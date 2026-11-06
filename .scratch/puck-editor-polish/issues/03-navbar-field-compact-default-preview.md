# 03: Navbar field, compact default and Site region preview

**What to build:** The NavbarBlock configures its layout and menu tree in one Navigation section, new navbars start in the compact layout, and the Site region editor gains a Preview control that lets an editor open the mega menu panels while composing the header. Preview does not change the properties panel or the save behaviour, and pages do not get the control.

**Blocked by:** 01 (editor controls and shared content-field wrapper)

**Status:** done

- [x] NavbarBlock exposes one Navigation section controlling a nested `content` object with `layout` and `items`.
- [x] The Navigation section reuses the existing structured menu editor for the typed menu tree.
- [x] New NavbarBlock instances default to the compact layout; `mega` remains available and already-saved documents keep their stored layout.
- [x] The Site region editor header exposes a Preview control that toggles Puck between edit and interactive preview.
- [x] The control shows the current state and a clear label for entering and leaving preview.
- [x] The properties panel and saving keep working while preview is active.
- [x] The page editor does not show the Preview control.
- [x] Tests cover the nested navigation content shape, the compact default, and the preview control's next-state and label logic.
- [ ] The mega menu opening in interactive preview is verified manually in development.
- [x] Type checking, targeted linting, the full test suite and the production build pass.

## Implementation notes

- `NavbarBlock` content is now `{ layout, items }`; the block exposes only that Navigation section plus the shared dimension and decoration fields. `NAVBAR_BLOCK_DEFAULT_CONTENT` lives in `defaults.ts` and starts with `layout: "compact"` and the Home item.
- `field.tsx` renders the layout segmented control and the existing `MenuItemsEditor` inside one `withContentField` accordion. Resetting the tree restores the default Home item; absent layout values fall back to compact in the UI projection.
- `render.tsx` and `server.tsx` read the nested content, so the editor canvas and the public server renderer share the same shape. The server still resolves SmartLinks before rendering.
- `EditorHeaderProps` gained an opt-in `showPreview` flag. Only `SiteRegionEditorView` sets it, so the page editor does not render the control.
- `getPreviewToggleState` is the pure seam (`editor/lib/preview-mode.ts`) for the next mode and labels; `PreviewToggle` dispatches Puck's `setUi({ previewMode })` and leaves the custom properties panel and header save/publish actions untouched.
- The manual interactive-preview check is left open: it requires a human to hover the mega menu in a running dev server.
- Verification: `npx tsc --noEmit`, targeted `npx eslint`, `npm run test:run` (222 files / 1838 tests) and `npm run build` pass.
