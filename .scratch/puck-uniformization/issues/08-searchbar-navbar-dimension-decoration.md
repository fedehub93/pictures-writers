# 08: Add dimension and decoration to SearchBar and NavbarBlock, and editor icons

**What to build:** SearchBar and NavbarBlock gain the shared dimension and decoration fields so the backoffice editor can set margin, padding, background, border and radius on the header blocks without wrapping them in extra layout blocks. Neither block gains a typography field, because their internal type scale is part of the control design and a wrapper field would be partly ignored. The editor sidebar shows dedicated icons and human labels for Announcement bar, SearchBar and NavbarBlock instead of the generic square fallback.

**Blocked by:** 01.

**Status:** done

- [x] SearchBar and NavbarBlock expose dimension and decoration and apply the shared variables and classes.
- [x] Neither block exposes a typography field.
- [x] The existing search variants and the responsive desktop/mobile navigation projections are unchanged.
- [x] The editor sidebar shows dedicated icons and human labels for Announcement bar, SearchBar and NavbarBlock; none falls back to the generic square.
- [x] Region palettes and categories are unchanged apart from the added fields.
- [x] Tests cover the new dimension and decoration variables and the existing behaviour.
- [x] Type check, lint and the test suite pass.

## Implementation notes

- SearchBar and NavbarBlock now declare `dimension` and `decoration` in their prop types and editor field configs; neither declares `typography`.
- `renderSearchBarBlock` computes `getDimensionVars` + `getDecorationVars` and applies `puck-dim puck-deco` to a wrapper element. The wrapper is deliberate: the same fields style the whole block in both the inline and the compact variant, and the shared classes no longer land on the compact trigger button, where `.puck-dim`/`.puck-deco` would reset its icon-button sizing and ghost surface.
- `renderNavbarBlock` keeps the existing `flex w-full items-center justify-end` wrapper so the navigation keeps its full-width placement, and applies the shared classes/variables to an inner element. The desktop mega menu and mobile sheet projections are untouched.
- Both blocks are opt-in: no `defaultProps` were added, so with no configured value no CSS variables are emitted and the existing spacing and surface classes keep working.
- `NavbarBlockServer` forwards `dimension` and `decoration` alongside the resolved menu tree; the editor canvas stays database-free.
- Editor sidebar metadata moved to `src/puck/editor/ui/view/element-meta.ts`, which gives Announcement bar a megaphone icon and label, SearchBar a search icon and label, and NavbarBlock a menu icon and label. The generic square fallback remains only for unregistered blocks.
- Tests: `search-bar-block.test.tsx` covers inline and compact variants through the shared render, the responsive dimension/decoration variables, the opt-in default and the field config (no typography). `navbar-block.test.tsx` covers the same variables on the shared render and the field config; `navbar-server.test.tsx` asserts the public server renderer forwards the new props while still resolving links. `editor-elements.test.ts` locks the icons and labels, and the render-pipeline SearchBar case now passes dimension and decoration.
- Verification: `npx tsc --noEmit`, targeted `npx eslint`, the full `npm run test:run` (221 files / 1830 tests) and `npm run build` pass. Repository-wide `npm run lint` still reports the 40 pre-existing errors and 244 warnings in unrelated files; none are in the changed files.
