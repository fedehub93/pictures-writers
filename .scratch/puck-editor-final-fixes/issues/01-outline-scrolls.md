# 01: The Outline tab scrolls, and the editor fills the screen exactly

**What to build:** Give the Outline tab the height contract the Widgets tab
already has, so Puck's own layers container — `flex-grow: 1; min-height: 0;
overflow: auto`, already correct — has a definite height to scroll within. The
Outline's header stays pinned; the tree scrolls under it. The Widgets tab, the
canvas and the properties panel are not touched. Alongside it, the editor's
height is corrected from `calc(100vh - 3.75rem)` to `calc(100vh - 4rem)` so the
columns fill the admin content area exactly instead of overshooting it by 4px.

**Status:** done

- [x] `TabsContent value="outline"` in `src/puck/editor/ui/view/sidebar.tsx`
      carries the same height/overflow contract as the widgets one
      (`flex-1 m-0 min-h-0 overflow-hidden`, active state as a flex column), and
      no class is written against a Puck CSS-module hash.
- [x] The Tab remains a two-child column: with a document taller than the
      column, Puck's layers container scrolls vertically and the Outline header
      does not move.
- [x] The Widgets tab still scrolls through its `ScrollArea`, with its markup
      and classes unchanged.
- [x] The properties panel and the canvas behave exactly as before: clicking a
      block in the canvas still selects it and swaps the panel to that block's
      fields, and the panel still scrolls inside its own container.
- [x] `editor.tsx` declares `h-[calc(100vh-4rem)]`, matching the `h-16` admin
      header, with a comment saying why the number is the header's.
- [x] A comment next to the Outline tab says why a tab needs `min-h-0`, so the
      next reader does not remove it.
- [x] `npm run lint`, `npm run typecheck` and the full test suite pass.
- [x] Browser probe (`node --env-file=.env.agent scripts/builder-probe.mjs`):
      on a document longer than the column, the Outline tab scrolls and nothing
      else changed.

## Comments

- 2026-11-17 — Implemented in `365d8dc6`. The Outline `TabsContent` now carries
  `flex-1 m-0 min-h-0 overflow-hidden outline-none` and `data-[state=active]:flex
  flex-col`; the widgets tab is untouched. The editor root is
  `h-[calc(100vh-4rem)]`, matching the `h-16` admin header that is its only
  chrome.
- Browser probe, `.env.agent`, `builder-probe` steps (headless Chrome,
  `innerHeight` 485): with the Outline active, the panel is 271px tall and its
  outline wrapper fills it (271px), while Puck's layers box is 220px with
  `overflow-y: auto`. Sixty rows appended to the tree give
  `scrollHeight` 3668 against a 220px client, `scrollTop` set to 200 reads back
  200, and the header stays at `top: 209` before and after the scroll. Switching
  back, the Widgets tab still renders its `ScrollArea` viewport at 271/713.
- No scrollable ancestor remains above the editor: walking from the tab list to
  the document, no element has `overflow-y: auto` with a scrollable overflow, so
  the 4px the old height overshot is gone.
- The canvas and the properties panel were driven afterwards, which is what the
  last box needed: the builder's right column starts on Page settings (Layout,
  Size, Spacing, Decoration) with its field scroller at 333/333 and
  `overflow-y: auto`; a click on the canvas `h2` selects the Heading, the frame
  then reports 2 blocks and one **Edit text** action button, and the panel swaps
  to the Heading's fields — `Level` (H2 selected) and the Layout, Size, Spacing
  and Typography sections — with no page exceptions.
- Verification: `npm run typecheck` clean; `npm run lint` 0 errors (265
  pre-existing warnings, none in a touched file); `npm run test:run` 271 files /
  2400 tests passed; `npm run check:doc-citations` 94 docs, 0 broken citations.
