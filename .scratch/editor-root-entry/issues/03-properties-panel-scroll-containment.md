---
Status: ready-for-human
Type: task
---

# Properties panel stops scrolling when the fields are taller than the viewport

## Goal

Restore vertical scrolling in the editor's right column, so a long properties panel scrolls inside its own column while the `Header › Block` breadcrumb stays pinned, and the three editor columns never grow past the viewport.

## Acceptance criteria

- [x] With enough field groups expanded to exceed the viewport, the right column scrolls and the breadcrumb stays fixed at the top.
- [x] The three-column grid keeps the viewport height: no column grows to the content height and no part of the panel is clipped by the grid's `overflow-hidden`.
- [x] The scroll container and the pinned header live in the same column; the layout the `editor-root-entry` spec requires is unchanged.
- [ ] Manual check in dev: Page editor, Header editor and Footer editor, with every field group expanded, at a short viewport (e.g. 1280×720).
- [ ] Manual check: with a short field list nothing changes — no scrollbar, no gap, no double scrollbar.

## Cause

`860bcad8 feat(puck): add editor root entry points` moved the scroll from the grid cell to an inner div, because the panel header has to stay pinned:

```tsx
// before
<div className="h-full overflow-y-auto border-l"><Puck.Fields /></div>

// after
<div className="flex h-full flex-col border-l">
  <EditorRootEntry … />
  <div className="flex-1 overflow-y-auto"><Puck.Fields /></div>
</div>
```

The shell grid, `grid-cols-[300px_1fr_300px]` with no row template, sizes its single implicit row as `auto`. An `auto` track grows to the tallest child's content, **except when that child is itself a scroll container** — so the old markup kept the row at the viewport height while the new markup let the fields' content height (measured: 1440px against a 789px grid) become the row height. The column then is `h-full` of that 1440px row, the inner `overflow-y-auto` has nothing to scroll, and the grid's `overflow-hidden` silently clips the rest.

`min-h-0` on the scroll container does not help here: the automatic minimum only matters once the row is definite.

## Implementation notes

- **Fix.** `src/puck/editor/ui/view/editor.tsx`: the grid gains `grid-rows-1`, i.e. `grid-template-rows: repeat(1, minmax(0, 1fr))` in Tailwind 4, which makes the row definite and equal to the container height. One class on the grid, with a load-bearing comment; the markup the `editor-root-entry` spec mandates is untouched.
- **Kept.** `min-h-0` on the field-list scroller (it states the flex intent even though it was not the cause) and `overflow-hidden` on the centre column (the grid must never widen).
- **Dropped.** `min-w-[300px]` on the right column: `grid-cols` already fixes it at 300px.
- **Rule to remember.** In this shell, a column may only become a plain layout container if the grid row is definite; an `auto` row turns any tall non-scrolling child into a clipped one.

## Verification

- Headless Chrome reproduction of the shell markup (viewport 1584×849, 1400px of fields) — row height 789 / scroll container 749 / scrollable with `grid-rows-1`, against 1440 / 1400 / not scrollable without it.
- `npx tsc --noEmit`, targeted ESLint on the touched file, `npm run test:run`.
- Manual: the checks above.

## Out of scope

- The editor's height magic number: `h-[calc(100vh-3.75rem)]` assumes a 3.75rem admin header, but `src/app/(admin)/_components/header/index.tsx` is `h-16` (4rem), so the admin container scrolls by 4px. The clean fix is `h-full`/`flex-1` inside `Container` rather than a corrected constant; tracked as a separate follow-up so this fix stays bisectable.
- Any browser/E2E harness.

## Comments

- 2026-11-11 — Root-caused from the commit history and reproduced headless: the properties panel lost its scroll when the cell stopped being the scroll container. Fixed with a definite grid row.
