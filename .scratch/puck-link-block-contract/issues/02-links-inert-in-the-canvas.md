---
Status: ready-for-agent
Type: task
Blocked by: none
---

# 02: Links inert in the canvas

**What to build:** While editing, clicking a Link block — or any entry of a
NavbarBlock — selects the block instead of navigating. A middle click,
Cmd/Ctrl+click and Enter on a focused link do nothing in the canvas. Puck's
interactive preview and the published page keep navigating exactly as today,
including links that open in a new tab, and the published markup is unchanged.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

## Acceptance criteria

- [ ] Clicking a Link with a resolved URL in the canvas does not navigate; the
      block gets selected and the properties panel opens.
- [ ] The same holds for every NavbarBlock entry: top-level link, call to action,
      mega-panel card, column child, and the mobile sheet rows and accordion
      children.
- [ ] A middle click and a Cmd/Ctrl+click do not open a tab in the canvas.
- [ ] Pressing Enter on a focused link in the canvas does not navigate.
- [ ] The interactive preview navigates, and the published page navigates with the
      same `target` and `rel` it renders today.
- [ ] The published render carries no click behaviour: the render-pipeline parity
      test still compares identical canvas and public markup, and the canvas
      output with `isEditing: true` is byte-identical to the public one.
- [ ] A broken or unresolved link still renders as plain text and stays
      selectable.
- [ ] A regression test observes the cancelled click at the mounted-block seam,
      not through a snapshot of the handler.
- [ ] `CONTEXT.md`'s **Canvas** entry states that interactive content is inert
      there, so the next reader does not treat the canvas as a live preview.

## Notes

- The anchor stays an anchor. While editing it cancels the default action of the
  click; `next/link` runs the `onClick` it receives before deciding, and bails on
  `defaultPrevented`. React's synthetic click also covers Enter on a focused
  anchor.
- Rejected: rendering a span while editing. Airtight, but it changes the tag in
  the canvas and needs an explicit exception to the exact-markup parity test.
- Rejected: `pointer-events: none`. The block root is the element the editor
  selects, hovers and drags; the block would become unselectable.
- The discriminator is Puck's `isEditing`. Interactive preview renders the
  document through the public `<Render>`, which passes `isEditing: false`, so
  links stay live there without a second flag.
- Scope stops at the Link block and the NavbarBlock because both are already
  client components: no new client boundary is added anywhere. The footer blocks
  are ticket 03.
- The site layout preview needs nothing: it is already inert through
  `pointer-events-none`.
- The rich-text link mark is the precedent (`openOnClick: false`); this ticket
  brings the block links in line with it.

## Comments

- 2026-11-11 — Ticket written from the grilling session. The defect is
  reproducible in the Header region editor: a Link with a page target navigates
  on click and the selection is lost.
