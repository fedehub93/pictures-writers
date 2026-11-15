# 01: Size and Spacing fields

**What to build:** Split the single `Dimension` style field into two peers on every block and on the document root. `Size` keeps width, height, max width, min height and aspect ratio; `Spacing` takes the margin and padding controls with their existing labelled groups. The stored shape splits the same way: the `dimension` prop becomes `size`, and a new `spacing` prop takes the eight spacing keys. The CSS class `.puck-dim` and every variable name stay, so nothing about the rendered page changes. The four dead offsets (`top`, `left`, `right`, `bottom`) are removed from the style type and from the stylesheet.

**Blocked by:** nothing.

**Status:** done

- [x] `src/puck/fields/dimension/` is `src/puck/fields/size/`: `SizeProps` (width, height, maxWidth, minHeight, aspectRatio), `SizeField`, `createSizeField({ baseWidth })`, the width presets and the view are renamed, and the label reads *Size*.
- [x] A new `src/puck/fields/spacing/` exposes `SpacingProps` (four margins, four paddings), `SpacingField` and a view with the two `bg-muted/60` groups labelled *Margin* and *Padding*, built from `PropHeader` and `ValueUnitInput`.
- [x] `getDimensionVars` is now `getSizeVars` and emits the same variables with the same width precedence (authored width, block base width, implied fill, explicit `auto`); a new `getSpacingVars` emits the eight margin and padding variables.
- [x] `.puck-dim` still resets and consumes all twelve variables; the four offset rules are gone from the base block, both media-query blocks and the reset list, and a comment states that the class is the box scope rather than the twin of a field.
- [x] All sixteen blocks and the root declare `size` and `spacing` with all three of type, field and render, and the panel order is block fields → Layout → Size → Spacing → Typography → Decoration (Layout → Size → Spacing → Decoration on the root, with the Header's sticky switch last).
- [x] The root type and both root render paths forward `size` and `spacing`: `RootProps`, `PageRootContent`, `renderRoot` and the page editor root.
- [x] Defaults and variants follow the same split: the Button's default padding and the padding its variants supply move to `spacing`, the Top bar's default padding moves to `spacing`, and the Separator's width and height stay in `size`.
- [x] The Image block's internal style-variable prop is renamed from `dimensionVars` to `sizeVars`, and comments that name the style surfaces (`slot-surface.tsx`, `types.ts`) read size and spacing.
- [x] No `dimension` prop, type, field or getter remains in `src/puck`; the only survivor is the `.puck-dim` class name.
- [x] Every test that builds a block document is updated rather than duplicated: width and height fixtures key `size`, margin and padding fixtures key `spacing`, and the emitted-variable and class-list assertions stay unchanged.
- [x] The field-list and order tests name `size` and `spacing` and pin the new order on blocks and on the root.
- [x] `dimension-width-vars.test.ts` and `dimension-width-field.test.tsx` are renamed to their `size-*` equivalents; a new test covers the Spacing view's two groups and its reset affordances.
- [x] `npm run lint`, `npm run typecheck` and the full test suite pass.

## Comments

- 2026-11-15 — Implemented in `cf2dc488`. `src/puck/fields/dimension/` moved to `src/puck/fields/size/` (`SizeProps`, `SizeField`, `createSizeField`, `SizeView`, the Width presets), and `src/puck/fields/spacing/` adds `SpacingProps`, `SpacingField` and `SpacingView` with the Margin and Padding groups. `getStyleVars` splits into `getSizeVars` (same width precedence, base width and implied fill untouched) and `getSpacingVars`. All sixteen blocks, `RootEditor` and both root render paths declare and forward `size` and `spacing`; the Image UI takes `sizeVars` and `spacingVars`; the Button and Top bar defaults split (`BUTTON_DEFAULT_PROPS.spacing`, `TOP_BAR_DEFAULT_SIZE` + `TOP_BAR_DEFAULT_SPACING`) and the Separator keeps its width and height in `size`. The four dead offsets left `SizeProps` and all three `.puck-dim` blocks.
- Verification: `npm run lint` 0 errors (265 pre-existing warnings), `npm run typecheck` 0, `npm test` 262 files / 2306 tests passed, `npm run check:doc-citations` 89 docs / 0 broken. The new Spacing view test and the renamed `size-*` tests pass; `layout-visibility` gained the all-block Layout → Size → Spacing → Typography/Decoration order assertion, and `root-surface-fields` pins the root order plus the Header's sticky switch last.
- The ticket says "twelve variables"; the box actually carries thirteen (width, height, max width, min height, aspect ratio plus the four margins and four paddings). The stylesheet keeps exactly the pre-split set minus the offsets, and the new section comment names the properties instead of counting them.
- Two notes for the rest of the effort. First, ticket 02's "no empty `spacing` object" rule has a narrow consequence: a document that authored a `dimension` without any padding (say only a width) migrates to `size` alone, so the block's default `spacing` now applies where the old shallow default merge was suppressed by the authored `dimension`. Ticket 03's dry run is the place to confirm whether any stored document is affected. Second, the `render-pipeline` Grid fixture keyed a dead `rowGap` inside `dimension`; it moved to `layout`, where the property is live.

## Implementation notes

- Touched blocks (each has `index.tsx`, `types.ts`, `render.tsx`): Brand, Button, Container, Copyright, Flex, Form, Grid, Heading, Icon, Image, LinkList, NavbarBlock, SearchBar, Separator, Text, TopBar — plus `src/puck/blocks/defaults.ts` and `src/puck/blocks/TopBar/defaults.ts`. The Header root inherits the new fields by spreading `RootEditor.fields`, so `src/puck/root/header.tsx` needs no change.
- Root files: `src/puck/root/types.ts`, `src/puck/root/index.tsx`, `src/puck/root/render.tsx`, `src/puck/root/page-editor.tsx` (the page editor root destructures and forwards the style props).
- Tests with margin or padding fixtures: `brand-block`, `brand-server`, `button-block`, `copyright-block`, `copyright-server`, `heading-block`, `link-list-block`, `navbar-block`, `navbar-server`, `render-pipeline`, `search-bar-block`, `text-block`, `top-bar-block`. Field-list assertions live in those same files plus `button-hover.test.tsx` and `root-surface-fields.test.tsx`. Fixtures that key `dimension` with size values only (`dehydrate-puck-forms.test.ts`, the Site region migration tests) become `size`.
- Sequence within the effort: until ticket 03 runs the migration, stored documents still carry `dimension` and the editor will show them unstyled. Land this ticket and the migration together in the same effort; the dry run in ticket 03 is what proves the pair.
