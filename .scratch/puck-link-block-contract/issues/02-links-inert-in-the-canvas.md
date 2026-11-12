---
Status: ready-for-human
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

**Status:** ready-for-human

## Acceptance criteria

- [ ] Clicking a Link with a resolved URL in the canvas does not navigate; the
      block gets selected and the properties panel opens.
- [ ] The same holds for every NavbarBlock entry: top-level link, call to action,
      mega-panel card, column child, and the mobile sheet rows and accordion
      children.
- [x] A middle click and a Cmd/Ctrl+click do not open a tab in the canvas.
- [ ] Pressing Enter on a focused link in the canvas does not navigate.
- [ ] The interactive preview navigates, and the published page navigates with the
      same `target` and `rel` it renders today.
- [x] The published render carries no click behaviour: the render-pipeline parity
      test still compares identical canvas and public markup, and the canvas
      output with `isEditing: true` is byte-identical to the public one.
- [x] A broken or unresolved link still renders as plain text and stays
      selectable.
- [x] A regression test observes the cancelled click at the mounted-block seam,
      not through a snapshot of the handler.
- [x] `CONTEXT.md`'s **Canvas** entry states that interactive content is inert
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
- 2026-11-11 — Implemented. `InlineSmartLink` gained an `editing` flag (Puck's
  `isEditing`) that cancels the anchor's default action instead of swapping the
  element: `preventDefault` on `click` covers the primary click, the
  Cmd/Ctrl/Shift+click and the click a browser dispatches for Enter on a focused
  anchor, and `onAuxClick` cancels the middle-click tab (`auxclick`, not
  `click`). `next/link` runs the `onClick` it receives first and returns as soon
  as the event is `defaultPrevented`, so no client-side navigation starts either.
  The Link render passes `puck?.isEditing`; `renderNavbarBlock` passes its
  existing `editing` down through the block UI, the desktop menu, the mega-panel
  column/card and the mobile sheet and accordion. No markup, no `target`/`rel`,
  no stored document and no schema changed: the handlers never reach the public
  render, and `puck.isEditing` is `false` in Puck's interactive preview because
  it renders through the public `<Render>`.
- 2026-11-11 — One deliberate extra: while editing, the consumer's `onClick` is
  not run. It exists as navigation feedback (the mobile sheet closes itself
  through it), and closing the menu on a click that no longer navigates would
  hide what is being edited. The flag therefore does one thing — the canvas owns
  the click.
- 2026-11-11 — Files: `src/puck/fields/link/ui/inline-link.tsx`,
  `src/puck/blocks/Link/{render.tsx,ui/link.tsx}`,
  `src/puck/blocks/NavbarBlock/{render.tsx,types.ts,ui/navbar-block.tsx,ui/desktop-menu.tsx,ui/mobile-menu.tsx,ui/nav-link-list.tsx,ui/navbar-card.tsx}`,
  `CONTEXT.md` (**Canvas** entry), plus `canvas-link-inert.test.tsx`.
- 2026-11-11 — Verification: `npx tsc --noEmit` clean; `npx eslint` on the
  touched files 0 errors/warnings; `npm run test:run` 249 files / 2109 tests
  pass. The new suite mounts the Link block and the NavbarBlock through the
  editor configs — the same seam Puck uses — and dispatches real clicks,
  `auxclick` and modifier clicks, `next/link` stubbed as a plain anchor so the
  assertion is about our contract rather than Next's router. It covers the
  Link, the desktop link and CTA, the mega-panel card and column child, the
  mobile sheet rows and accordion children, the plain-text fallback, the
  published path, and a NavbarBlock parity case (`editing` true / false /
  omitted, the last being what the server renderer passes) that renders
  byte-identical markup. The render-pipeline parity test is unchanged.
- 2026-11-11 — Remaining for the maintainer (browser checks, hence
  `ready-for-human`): the selection itself — Puck attaches its click listener to
  the block root, so the desktop entries must select the navbar, and the mobile
  sheet deserves a look because `SheetContent` is portaled to `document.body`,
  outside that root: cancellation is proven, re-selection there is not, and the
  ticket does not change where the sheet renders. Also unverified by unit tests:
  Enter on a focused link (happy-dom does not synthesise a click from a key
  press), the interactive preview navigating again, and a `_blank` link keeping
  its tab on the published page. `next/link`'s `defaultPrevented` bail is pinned
  by the stub's comment, not by Next's own code.
- 2026-11-12 — The browser run proved the first implementation ineffective on the
  Link block, and the cause is the canvas: Puck attaches a native `click`
  listener to the block root and calls `stopPropagation()` there
  (`DraggableComponent` in `@puckeditor/core`). React delegates to the root
  container, so for a block whose root *is* the anchor — the Link — a bubble
  handler never runs and the browser default navigates. The cancellation moved
  to the capture phase (`onClickCapture` / `onAuxClickCapture`), which React
  dispatches before the event reaches the block root; `onClick` stays a bubble
  handler and is still not run while editing. The mounted-DOM suite now
  reproduces the editor's listener — a `stopPropagation` click listener on the
  block root — for both the Link and the NavbarBlock, and those two cases failed
  against the previous implementation while the rest of the suite was green.
- 2026-11-12 — Consequence worth knowing for the next reader: in edit mode Puck
  also applies `[data-puck-component] * { pointer-events: none }`, so only a
  block whose root is the anchor is hit-testable at all. That is why the Link was
  the visible defect; navbar entries inside the block root, and rich-text links
  inside a Heading, cannot receive the click in the canvas (the mobile sheet is
  the exception, because it is portaled outside that root). The rich-text link
  mark therefore is not a precedent for the canvas, only for the properties
  panel: `openOnClick: false` never applies to the canvas render, which is plain
  HTML. That correction is recorded in the spec's editing-behaviour decision.
