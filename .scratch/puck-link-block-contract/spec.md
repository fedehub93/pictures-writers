# Puck Link block contract: natural width and inert links in the canvas

## Problem Statement

After the canvas tree parity work (ADR-0040) every block root is the element its
parent lays out, and the Link block's root is the anchor itself. The anchor
became the flex/grid item, so inside a flex column with no authored `align-items`
— the shape of the real Policy page and of the header CTA — `width: auto`
stretches: the link covers the whole row, its click area grows with it, and a
link with a background and padding reads as a bar instead of a button. The same
document looked shrink-to-fit before the editor wrapper was removed, so the
default appearance of every existing Link changed while no stored value changed.

The Width field cannot explain that: it shows *Auto*, described as "no width",
while the box measures the full row. The mechanism that solves it exists
(*Fit content*, which stores `fit-content`), but nothing points at it and, being
a document value, it would have to be authored link by link.

Separately, a Link with a resolved URL is a live anchor in the canvas. Clicking
it navigates away from the document being edited: the selection, the properties
panel and any unsaved change are lost. The NavbarBlock has the same defect. The
rich-text link mark already avoids it (`openOnClick: false`), so two surfaces of
the same editor disagree about what a link is while editing.

## Solution

A Link is content-sized by default, in the canvas and on the published page,
without a stored document changing. A block that knows its natural width says
so, and the Width field names it instead of leaving *Auto* ambiguous. *Fill*
stays the deliberate choice for a full-width button.

While editing, clicking a Link — or a navbar entry — selects the block instead
of navigating. Puck's interactive preview and the published page keep the link
live, and the published markup stays exactly what it is today: the inert
behaviour exists only where the canvas renders.

The footer blocks (Link list, Copyright) get the same behaviour later, through
an editor-only render variant, so the published footer keeps shipping no
JavaScript for those blocks.

## User Stories

1. As a backoffice editor, I want a Link dropped in a column to be as wide as its
   label, so that a text link keeps the click area of its text.
2. As a backoffice editor, I want a Link with a background and padding to look
   like a button and not like a full-width bar, so that the design I authored is
   the design visitors get.
3. As a backoffice editor, I want that width to be the same in the canvas and on
   the published page, so that I do not discover the real shape after publishing.
4. As a backoffice editor, I want to keep a Link that I deliberately stretched,
   so that fixing the default does not undo an authored decision.
5. As a backoffice editor, I want *Fill* to stay one click away, so that a
   full-width CTA remains possible without knowing CSS.
6. As a backoffice editor, I want the Width field's *Auto* to say what this block
   falls back to, so that the panel does not contradict the box.
7. As a backoffice editor, I want the same behaviour at desktop, tablet and
   mobile, so that the block does not change meaning across breakpoints.
8. As a backoffice editor, I want an explicit per-breakpoint width to still win
   over the block default, so that the responsive ladder stays the authority.
9. As a backoffice editor, I want to be able to cancel the default at one
   breakpoint with the explicit `auto`, so that a single breakpoint can stretch.
10. As a backoffice editor, I want a Link that caps its width to hug up to the
    cap instead of becoming full width, so that "max width" means the same thing
    on a label as on a content area.
11. As a backoffice editor, I want existing documents to look right after the
    deploy without re-authoring them, so that published pages do not need a
    migration.
12. As a backoffice editor, I want clicking a Link in the canvas to select it, so
    that I do not lose my selection and unsaved changes to a navigation.
13. As a backoffice editor, I want clicking a navbar entry in the canvas to
    select the navbar, so that editing the header is not a minefield.
14. As a backoffice editor, I want a middle click or a Cmd/Ctrl+click on a link in
    the canvas to do nothing, so that no tab opens behind the editor.
15. As a backoffice editor, I want pressing Enter on a focused link in the canvas
    to keep me on the page, so that keyboard navigation cannot navigate either.
16. As a backoffice editor, I want the interactive preview to navigate, so that I
    can walk the site I am building.
17. As a visitor, I want the published page to navigate exactly as today,
    including links that open in a new tab, so that nothing about the live site
    changes.
18. As a visitor, I want the published page to ship no editor behaviour, so that
    the DOM stays clean and the page payload does not grow.
19. As a visitor using assistive technology, I want the published link to stay an
    anchor with its label, so that the semantics are unchanged.
20. As a developer, I want one function to resolve the width for both render
    paths, so that the canvas and the page cannot disagree.
21. As a developer, I want the Width field configured from the same constant as
    the render, so that the panel cannot drift from the box.
22. As a developer, I want the render-pipeline parity test to keep comparing
    identical markup, so that the inert behaviour cannot silently change the
    tree.
23. As a developer, I want the click contract tested at a seam that can observe
    a handler, so that the test asserts behaviour rather than markup.
24. As a maintainer, I want no schema or document change, so that this ships as a
    normal deploy.
25. As a maintainer, I want the decision recorded in the ADR that introduced
    block roots, and the new term in the glossary, so that the next reader knows
    why a Link differs from a Container.
26. As a maintainer, I want the footer blocks to adopt the same behaviour later
    without shipping client JavaScript, so that the published page never pays for
    an editor concern.

## Implementation Decisions

**Width.**

- The natural width is a **block base width**, not a document default: a value
  the block declares, consumed by the shared style-variable function that both
  render paths call. It is emitted on the desktop rung so the responsive ladder
  inherits it, and it is replaced by any authored width.
- Precedence, highest first: an authored width at the breakpoint (or inherited
  from a wider one, the explicit `auto` included) → the block base width → the
  implied fill a content-area block gets when it authors only a max width.
  A label is not a content area: with a base width there is no collapse to
  compensate, so the implied fill no longer applies to it.
- *Auto* keeps storing nothing. The panel's preset description names what Auto
  resolves to, which is either the width inherited from a wider breakpoint, the
  block default, or nothing. This is the existing *Fill*/*Fit content* preset
  row, not a new control.
- The Dimension field becomes a factory so a block can declare its base width;
  the Link wires it with the same constant the render uses. The panel and the box
  read the same value, so they cannot disagree.
- **Rejected: a document default.** Puck merges defaults with a shallow spread,
  so a nested default is dropped by any document that authored the dimension
  object — which is nearly every existing Link, padding and margins included.
  It would fix new blocks only, and the two paths would disagree about what a
  freshly dropped versus an existing block looks like.
- **Rejected: a one-off document migration.** It would rewrite published
  documents and shrink buttons an author may have wanted full width. The ticket
  that introduced the implied fill accepted the same trade-off: no data change.
- **Rejected: exposing `align-self` on leaf blocks.** It is the semantically
  precise escape hatch, but it only means something in a flex parent, it is not
  authorable today, and the width field already expresses the intent in both
  flex and grid parents. `align-self` stays vocabulary only.

**Editing behaviour.**

- The anchor stays the anchor; while editing it cancels the default action of the
  primary and auxiliary click. `next/link` calls the `onClick` it receives before
  deciding whether to navigate, and bails on `defaultPrevented`; React's synthetic
  click also covers Enter on a focused anchor.
- **Rejected: rendering a span while editing.** Airtight, but it changes the tag
  in the canvas and would require an explicit exception to the render-pipeline
  test, which asserts the canvas and the page produce identical markup.
- **Rejected: `pointer-events: none` while editing.** The block root is also the
  element the editor selects, hovers and drags, so the block would become
  unselectable.
- The discriminator is Puck's `isEditing`. The interactive preview renders the
  document through the public `<Render>`, which passes `isEditing: false`, so
  links stay live there by construction rather than by a second flag.
- Scope now: the Link block and the NavbarBlock. Both are already client
  components, so the inert handler adds no new client boundary. The Link list and
  Copyright blocks are server-rendered; making their shared UI client would ship
  the footer's JavaScript to every visitor, so they are deferred to a ticket that
  keeps the public render on the server and gives the editor its own variant.
- No behaviour is keyed off a Puck attribute, so a future upgrade that changes
  its DOM cannot silently re-enable or break navigation.

**Documentation.**

- ADR-0040 gains the consequence it is missing: a leaf whose root is a
  text-level box needs a natural width to keep meaning "as wide as my label"
  once it becomes a flex/grid item, and that width outranks the implied fill.
- The glossary gains **Block base width** in the Puck editor fidelity section,
  and the **Canvas** entry states that interactive content is inert there.

## Testing Decisions

- A good test here asserts a contract, not pixels: the emitted width variables,
  the sentence the panel shows, the block root's markup, and whether a click is
  cancelled. Nothing asserts a computed layout, because `fit-content` is the
  value and browser resolution is not a unit test.
- **Seam 1, the shared width function.** Highest possible: it is the single
  function both paths call, and the existing width-intent suite already pins its
  emitted variables. New cases: base only, base plus max width, authored width
  winning at the same and at another breakpoint, explicit `auto` cancelling, and
  blocks without a base emitting exactly today's variables.
- **Seam 2, the mounted Dimension panel.** Existing happy-dom suite for the
  width control. New cases: *Auto* reads the block default when nothing is
  inherited, still reads the inherited value when there is one, and reads "no
  width" for blocks without a base.
- **Seam 3, the block render in static markup.** Existing Link block suite and
  the consolidated render-pipeline parity test. New cases: the root carries the
  base width, an authored width wins, and the editor output with `isEditing: true`
  is still byte-identical to the public output.
- **Seam 4, the block render mounted in a DOM (new).** The only way to observe a
  handler, and the prior art is the existing mounted block tests. `next/link` is
  stubbed with a plain anchor so the assertion is about our contract — that the
  click is cancelled, not that Next navigates — and the stub records the
  dependency on `defaultPrevented` in a comment. Cases: editing cancels the
  click and the auxiliary click; not editing leaves them alone; the navbar
  projection receives the same flag.
- **Not tested by unit tests:** that a browser paints `fit-content` as the
  label's width, that selection still works after the handler, and that the
  interactive preview navigates. Those are interactive checks in the canvas.
- The footer ticket adds its own seam check: the public render configuration must
  keep pointing at the server render, asserted at the configuration level rather
  than by inspecting a bundle.

## Out of Scope

- The Link list and Copyright blocks (ticket 03).
- Any other server-rendered block that renders links.
- Exposing `align-self` in the leaf Layout field.
- Changing the implied-fill rule for content-area blocks.
- Migrating or backfilling stored documents.
- Native anchor drag while editing (`draggable`): a candidate follow-up, not
  required to stop navigation.
- Redesigning the Link field, the palette label or the block markup.
- The site layout preview: it is already inert through `pointer-events-none`.

## Further Notes

- Evidence used for the spec: two real documents in the development database —
  the Policy page's "Torna alla home" link inside a flex column that authors
  `align-items` only at tablet, and the header's "Feedback Gratuito" CTA inside a
  flex row. The first fills at desktop and shrinks at tablet; the second is
  already intrinsic.
- An implementation was started and reverted before this spec was written; the
  working tree was clean at that point, and this effort starts from tickets.
- Builds on `puck-canvas-tree-parity` (the block root, the root zone, the width
  states) and on ADR-0039 (the breakpoint ladder) and ADR-0040 (one element tree).
- Terminology used: Block root, Canvas, Live source of truth, Breakpoint, Public
  defaultProps, Site region.

## Tickets

| # | Ticket | Status | Blocked by |
| - | ------ | ------ | ---------- |
| 01 | Link base width | done | — |
| 02 | Links inert in the canvas | ready-for-human | — |
| 03 | Footer links inert without client cost | needs-triage | 02 |
