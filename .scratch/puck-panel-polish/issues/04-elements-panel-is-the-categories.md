# 04: The Elements panel is the categories

**What to build:** A palette that draws the config's categories — one group per
category, in declaration order — instead of every registered component in one
flat list. A component that no category lists is not offered, which is how a
block leaves the palette while it stays registered and its stored documents keep
rendering. The search filters the groups, keeps them, and shows an empty state
when nothing matches. The decorative heading, its badge and the tab with no
content are gone.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] The panel draws one group per declared category, with its title, in
      declaration order; a component no category lists is not offered.
- [ ] A block can still be dragged from a group exactly as before, in the page,
      Header and Footer editors.
- [x] The search filters by label, is case-insensitive, keeps the grouping of
      the matches, and shows an empty state instead of a blank panel.
- [x] The decorative heading and its badge are gone, and no tab can be opened
      that renders nothing.
- [x] A test asserts every editor config declares categories, and that the page
      categories list neither Flex nor Grid.
- [x] A test renders the panel from a config and asserts the groups, the
      filtered result and the empty state.
- [x] Typecheck, lint and the full test suite pass.

## Comments

### 2026-11-16 — implemented in `cb427389`

`ElementsPanel` now renders `ElementsPalette` (`editor/ui/view/element-palette.tsx`),
whose groups come from `config.categories` in declaration order. Every category is
drawn with its own heading and its own `Drawer`; the component map is only read for
the label and icon of a listed name, so a registered block no category lists is not
offered. Search matches labels case-insensitively, drops the groups it empties and
replaces the panel with `No blocks match "<query>"` when nothing is left. The
"Atomic Elements" heading and its "New" badge are gone, and so is the "Globals" tab
(only Widgets and Outline remain). The panel title, the search placeholder and the
tile markup are unchanged.

Tests: `elements-palette.test.tsx` renders the palette for the page, Header and
Footer editor configs, asserting each config's group order, that registered-but-
unlisted Flex and Grid are not offered on a page, the case-insensitive filtered
grouping, and the empty state. `page-palette.test.ts` asserts every editor config
declares categories, that each category lists only registered blocks, and that the
page categories list neither Flex nor Grid.

Verification: `npm run typecheck` clean; ESLint clean on the four changed files;
`npm run test:run` — 268 files, 2382 tests passing. A browser probe in the agent
environment (`scripts/builder-probe.mjs --server`) against the real builder reported
groups `Layout, Basic, Typography, Actions`; tiles `Container, Icon, Image, Form,
Separator, Heading, Text, Button` (no Flex or Grid); after typing `on`, groups
`Layout, Basic, Actions`; after typing `zzz`, zero tiles and `No blocks match "zzz"`;
no page errors.

Not verified: the drag gesture itself. The drag wiring (`Drawer` + `Drawer.Item`) is
unchanged, and the grouped markup was rendered in the real builder for all three
configs, but `builder-probe` resolves drag coordinates inside the canvas iframe only,
so a palette-to-canvas drag cannot be expressed with it. The tick above stays open
until that gesture is checked by hand.
