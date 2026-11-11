---
Status: ready-for-agent
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

- [ ] In the Header region editor, a Top bar with `display: flex` and
      `justify-content: center` centres a Heading in the canvas and on the
      published page.
- [ ] `align-items`, `flex-direction`, `flex-wrap`, `justify-content`,
      `align-content`, `justify-items`, the gaps and the grid tracks authored on
      the bar reach its slot children at all three breakpoints. No hardcoded
      vertical centring remains on the path between the author's value and the
      blocks.
- [ ] `display: none` at a breakpoint removes the whole strip from the live page,
      background and padding included.
- [ ] In the canvas, a bar hidden at the current breakpoint stays selectable as
      the existing ghost placeholder.
- [ ] An empty bar still publishes no strip, and an empty bar in the canvas keeps
      a working drop target and selection.
- [ ] A dismissible bar keeps the close button on the trailing edge without
      covering the content, and the button is still absent from the canvas.
- [ ] `align-self` authored on the bar keeps describing the bar as a child of its
      parent, not its content.
- [ ] A document that never authored a layout keeps today's look: full width, one
      row, vertically centred. A document whose layout omits `display` still
      renders a row instead of collapsing to an inline box.
- [ ] Tests: the render-pipeline parity test still passes with the new slot
      classes; the Top bar test asserts the layout surface and its variables on
      the slot, the visibility markers and `align-self` on the root, the close
      button out of flow, and the empty-bar public rule; one assertion per
      breakpoint.
- [ ] The registry-consistency assertion is in place (each editor component's
      `defaultProps` is the shared defaults entry), closing the follow-up left by
      ticket 01.
- [ ] `npx tsc --noEmit`, targeted ESLint and `npm run test:run` pass.

## Notes

- The hidden-at-breakpoint and placeholder classes must stay on the block root:
  the canvas ghost styling keys off a direct child of the Puck component wrapper.
- The layout classes reset the display variables locally, so both the root and
  the slot need an explicit desktop fallback.
- Do not use `display: contents` on the slot wrapper: an empty slot would lose
  its drop box and the canvas would stop matching the live page.
