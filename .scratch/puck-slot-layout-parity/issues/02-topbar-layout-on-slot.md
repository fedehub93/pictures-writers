---
Status: done
Type: task
Blocked by: 01-public-defaults-parity
---

# Top bar layout drives its content row

## What to build

A Top bar must behave like a Container: the blocks inside it follow the Layout
field the author sets. Today the layout is applied to the strip root while the
blocks live one level deeper, in the slot wrapper, so `justify-content` centres
nothing, `align-items` is inert, gaps and grid tracks stop at the wrapper, and
vertical centring is hardcoded. Move the layout surface to the slot — the same
element the Container already uses — and keep on the strip only what describes
the strip.

## Blocked by

- `01-public-defaults-parity` — **already done**. The dependency is about
  order, not outstanding work: this ticket extends the parity test and the
  per-block defaults introduced there, and its layout changes assume the public
  render already applies the same defaults. The edge is satisfied now, so this
  ticket can start immediately.

## Acceptance criteria

- [x] In the Header region editor, a Top bar with `display: flex` and
      `justify-content: center` centres a Heading in the canvas and on the
      published page.
- [x] `align-items`, `flex-direction`, `flex-wrap`, `justify-content`,
      `align-content`, `justify-items`, the gaps and the grid tracks authored on
      the bar reach its slot children at all three breakpoints. No hardcoded
      vertical centring remains on the path between the author's value and the
      blocks.
- [x] `display: none` at a breakpoint removes the whole strip from the live page,
      background and padding included.
- [x] In the canvas, a bar hidden at the current breakpoint stays selectable as
      the existing ghost placeholder.
- [x] An empty bar still publishes no strip, and an empty bar in the canvas keeps
      a working drop target and selection.
- [x] A dismissible bar keeps the close button on the trailing edge without
      covering the content, and the button is still absent from the canvas.
- [x] `align-self` authored on the bar keeps describing the bar as a child of its
      parent, not its content.
- [x] A document that never authored a layout keeps today's look: full width, one
      row, vertically centred. A document whose layout omits `display` still
      renders a row instead of collapsing to an inline box.
- [x] Tests: the render-pipeline parity test still passes with the new slot
      classes; the Top bar test asserts the layout surface and its variables on
      the slot, the visibility markers and `align-self` on the root, the close
      button out of flow, and the empty-bar public rule; one assertion per
      breakpoint.
- [x] The registry-consistency assertion is in place (each editor component's
      `defaultProps` is the shared defaults entry), closing the follow-up left by
      ticket 01.
- [x] `npx tsc --noEmit`, targeted ESLint and `npm run test:run` pass.

## Notes

- The hidden-at-breakpoint and placeholder classes must stay on the block root:
  the canvas ghost styling keys off a direct child of the Puck component wrapper.
- The layout classes reset the display variables locally, so both the root and
  the slot need an explicit desktop fallback.
- Do not use `display: contents` on the slot wrapper: an empty slot would lose
  its drop box and the canvas would stop matching the live page.

## Implementation notes

- The slot now carries `puck-layout` plus the container-level variables
  (direction, wrap, justify, align, align-content, justify-items, gaps, grid
  tracks). The root carries only the new `.puck-layout-item` surface: the
  responsive `display` rule and `align-self`, next to its dimension and
  decoration.
- `partitionLayoutVars` splits the shared variable map into display, item and
  container groups, so the three surfaces cannot drift. `withDesktopDisplay`
  gives both boxes the explicit desktop fallback the layout resets require.
- In the canvas the slot drops every authored `display: none` and falls back to
  the nearest visible breakpoint, so the root's placeholder still shows its
  content. The public path keeps the authored `none` on both boxes.
- The close button is `absolute`, pinned to the trailing edge with `end-1` and
  vertically centred, and the slot reserves `pe-8` while the bar is dismissible.
  The reservation is kept in the canvas too, so the slot classes never change
  between authoring and publishing.
- The empty-bar public rule is untouched because the slot wrapper stays a direct
  child of the root; the test now also asserts the selector in `puck-base.css`
  and that the empty slot markup really is `:empty`.
- `render-pipeline.test.tsx` gained the registry-consistency assertion: every
  editor component's `defaultProps` must be the identical object from
  `BLOCK_DEFAULT_PROPS`, and a component outside the map may not keep a private
  default. The parity `SlotStub` now forwards `style`, so the slot's inline
  variables are compared between the two configs.

## Verification

- `npx tsc --noEmit` clean.
- Targeted ESLint on the touched files clean.
- `npm run test:run`: 243 files / 2011 tests pass.
- Two-axis code review (Standards and Spec), two passes: initial findings
  addressed (item-level class, shared predicates/helpers, all-breakpoint
  assertions, both-config Top bar test, glossary terms); see the comments.

## Comments

**2026-11-11 — two-axis review, first pass.** The first implementation left
`puck-layout` on both boxes, duplicated the desktop fallback and the dismiss
predicate, and only asserted all layout properties at desktop. It was reworked:
`.puck-layout-item` became the root's item-level surface, `partitionLayoutVars`
and `withDesktopDisplay` replaced the ad-hoc pickers, `showsDismissButton`
centralises the button predicate, and the breakpoint test now asserts every
layout variable at desktop, tablet and mobile.

**2026-11-11 — two-axis review, second pass.** The remaining divergences were
closed: the Top bar test now renders through the editor and public region
configs (with the shared defaults merged) and asserts their markup is equal; the
`pe-8` reservation follows `dismissible` in both environments instead of only
on the public path; and the empty-bar assertion checks the actual `:has(> …
:empty)` selector. The only remaining shared-export concern is
`omitHiddenDisplayVars`, which has one consumer but keeps the canvas rule
readable and separately testable.
