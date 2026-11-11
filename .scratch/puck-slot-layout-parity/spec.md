# Puck render fidelity: public default props and the top bar layout

## Problem Statement

A backoffice editor builds the Header region and cannot trust the canvas. Two
symptoms surface in the same session:

- A Top bar with `display: flex` and `justify-content: center` keeps its content
  at the leading edge. The vertical alignment chosen in the Layout field does
  nothing, and gaps or a grid track list never reach the blocks inside the bar.
  The same blocks inside a Container behave as expected, so the Top bar's
  contract contradicts what its own defaults describe.
- A block dropped from the palette looks different as soon as it is published:
  Puck applies default props in the canvas only, so the widths, link typography
  and region-block content the canvas shows are missing on the live page.

Because the canvas is the authoring surface, every mismatch forces a
publish → look → fix loop, and the Site layout preview built around the page
editor inherits the same lie.

## Solution

One layout contract, shared by the canvas and the public page.

- Every block's default props have a single definition. The editor receives it
  through Puck's `defaultProps`; the public render applies the same values
  through a shared merge, so a freshly dropped block looks identical before and
  after publishing.
- The Top bar's Layout field describes the row that holds its slot content, the
  way it already does on a Container. The strip keeps only what belongs to the
  strip: its own box (width, padding), its decoration, its item-level layout and
  its visibility.
- The canvas and the live page keep drawing the same classes on the same
  element: the layout surface is the slot wrapper in both paths, so there is
  nothing left to approximate.

## User Stories

1. As a backoffice editor, I want `justify-content` on a Top bar to centre its
   blocks, so that the canvas shows the arrangement I authored.
2. As a backoffice editor, I want `align-items` on a Top bar to control the
   vertical alignment of its blocks, so that the Layout field is not decorative.
3. As a backoffice editor, I want the gaps written in the Layout field to
   separate the blocks inside the bar, so that spacing is authored once.
4. As a backoffice editor, I want to switch a Top bar to a grid with authored
   tracks, so that a multi-column strip does not need nested Containers.
5. As a backoffice editor, I want `flex-direction` and `flex-wrap` to reach the
   blocks inside the bar, so that I can stack them on mobile and lay them out in
   a row on desktop from a single block.
6. As a backoffice editor, I want hiding the Top bar at a breakpoint to remove
   the whole strip, background and padding included, so that no coloured band is
   left behind on the live page.
7. As a backoffice editor, I want the hidden bar to stay visible in the canvas
   as a placeholder at the breakpoint where it is hidden, so that I can select
   and unhide it without switching documents.
8. As a backoffice editor, I want an empty Top bar to leave no strip on the live
   page, so that a bar I emptied before publishing disappears cleanly.
9. As a backoffice editor, I want the close button of a dismissible bar to stay
   on the trailing edge without covering the content, so that a long strip
   remains readable and dismissible.
10. As a backoffice editor, I want the close button to stay out of the canvas,
    so that the bar remains editable after I dismissed it on the live site in
    the same browser.
11. As a backoffice editor, I want a block dropped from the palette to look the
    same on the live page without a publish round trip, so that I can trust what
    I see while authoring.
12. As a backoffice editor, I want an existing page or region that never
    authored the new fields to keep its current look, so that publishing this
    change does not silently restyle old documents.
13. As a backoffice editor, I want a newly dropped Image to keep its natural
    size, so that a logo inside a flex row is not stretched to the full width by
    a default I never asked for.
14. As a backoffice editor, I want the page content to span the same width in
    the canvas and on the published page, so that the block arrangement I see is
    the one visitors get.
15. As a backoffice editor, I want an Image that needs to fill its box to keep
    that as an explicit Dimension choice, so that the default is predictable and
    reversible.
16. As a backoffice editor, I want a Link's default typography and a Top bar's
    default settings to reach the live page, so that what I see in the canvas is
    not a canvas-only decoration.
17. As a backoffice editor, I want Brand, Copyright and LinkList to show their
    default content on the live site when the stored document omits it, so that
    an old region document does not render a blank header.
18. As a developer, I want one place to change a block's default, so that the
    editor and the public render cannot drift apart.
19. As a developer, I want the parity test to fail when the editor and the
    public render diverge for any block, so that regressions are caught before a
    publish.
20. As a developer, I want the shared defaults map and the editor registry to be
    asserted equal, so that a block cannot keep a private default or lose its
    entry silently.
21. As a maintainer, I want no database change and no document migration, so
    that this can ship as a normal deploy.
22. As a maintainer, I want the public markup to change only where a document
    was missing a default, so that I can reason about the blast radius.
23. As a reviewer, I want the acceptance to be checkable from the rendered
    markup at all three breakpoints, so that no manual pixel comparison is
    needed to see whether the contract holds.
24. As an editor, I want drag-and-drop and selection to keep working on an empty
    bar, so that fixing the layout does not cost me the drop target.

## Implementation Decisions

- **Single defaults definition.** Every block default lives in one block-defaults
  module. The editor registry consumes it as each component's `defaultProps`;
  the public render consumes the same map through a wrapper applied per
  component.
- **Merge semantics.** The public wrapper applies defaults with the same shallow
  spread Puck uses in the canvas (`{ ...defaults, ...props }`). Explicit values
  win, and a nested object the author touched replaces the default object whole,
  because that is what the canvas already does. A deeper merge would keep a
  per-breakpoint default the canvas has dropped and would reintroduce the drift
  this spec removes. Slot functions are therefore preserved like any other
  authored value: they override the default.
- **Top bar layout surface.** The slot element carries the responsive layout
  contract (the layout classes) and the container-level variables: flex
  direction and wrap, justify, align, align-content, justify-items, the gaps and
  the grid tracks. The strip root keeps the item-level `align-self`, so its
  meaning as a child of the parent block is preserved.
- **Display split.** The authored display is emitted to both the strip root and
  the slot. On the root it drives whole-block visibility, including responsive
  hiding; on the slot it drives the authored layout at the visible breakpoints.
  Both elements declare an explicit desktop fallback, because the layout classes
  reset the display variables locally and an unauthored value would otherwise
  resolve to an inline box.
- **Visibility markers stay on the root.** The hidden-at-breakpoint and
  placeholder classes remain on the block's outermost element, because the
  canvas ghost styling keys off a direct child of the Puck component wrapper.
- **Dismissal leaves the flow.** The close button stops being a flex item of the
  layout row and is pinned to the trailing edge; the slot reserves trailing
  space while the bar is dismissible so content never sits underneath it.
- **Empty bar.** The public rule that hides a bar whose slot is empty keeps
  matching, because the slot wrapper stays a direct child of the root.
- **Image default.** A freshly dropped Image keeps its natural size. Full width
  remains available as a Dimension value, so documents that authored it are
  unaffected. ADR-0039 carries a dated revision recording the change.
- **Page root width.** The page root states a full width explicitly instead of
  relying on an unset dimension variable that resolves to `auto`.
- **No data changes.** No schema change, no migration, no backfill, no new
  field. Documents keep their stored props; defaults are applied at render time.
- **Glossary.** The contract is recorded in `CONTEXT.md` under *Puck editor
  fidelity* (*Live source of truth*, *Slot wrapper parity*, *Public
  defaultProps*), plus *Site layout preview* and *Editor root*.

## Testing Decisions

- **Good tests here** assert rendered markup and the emitted class/variable
  contract through the editor and public configs. They do not reach into the
  merge helper or assert implementation details, because the same helper is used
  by every block and the risk lives in the per-block wiring.
- **Highest existing seam.** The consolidated render pipeline parity test already
  renders every shared block through both configs and compares the markup. It is
  extended, not duplicated: it is the one seam that covers the whole registry,
  including future blocks.
- **Registry consistency.** The same file gains an assertion that each editor
  component's `defaultProps` is the shared defaults entry for that block, so a
  private default or a missing entry fails instead of silently diverging.
- **Component seam.** The Top bar component test renders the block through both
  configs and asserts: the layout surface and its variables are on the slot, the
  visibility markers and `align-self` are on the root, the root no longer
  hardcodes vertical centring, the close button is out of the layout flow, and
  an empty bar is hidden on the public path.
- **Breakpoints.** Assertions cover desktop, tablet and mobile, because the
  responsive contract is expressed as variables resolved by media queries.
- **No new browser/e2e seam.** Pixel comparison is not the behaviour under test;
  the manual pass in the Header region editor remains the last step.

## Out of Scope

- Redesigning the Layout field or adding options to it.
- Changing Container, Flex or Grid internals: their layout surface already is
  the slot.
- The sticky header, the properties panel, the Outline, the Site layout preview
  chrome and its status chip.
- New blocks and palette changes.
- Migrating stored documents or backfilling props that were never authored.
- Pixel fidelity for the blocks that render third-party content (Form,
  NavbarBlock) beyond what the shared pipeline already provides.
- Any change to the public page routing, caching or revalidation.

## Further Notes

- `display: contents` on the slot wrapper was rejected: it removes the box the
  editor's drop zone needs for an empty slot and would make the canvas and the
  live page structurally different, which is the defect being fixed.
- The dimension, layout and decoration variables are resolved by the element
  that carries them, so the layout surface has to move rather than be mirrored on
  both boxes.
- Prior art for this work: `.scratch/site-region-authoring/` (intrinsic header
  blocks and the faithful canvas) and `.scratch/puck-uniformization/` (the shared
  field → variable → class pipeline, including the Top bar layout field).
- ADR-0039 was revised rather than superseded: only its Image paragraph changed,
  and the rest of the breakpoint ladder decision still stands.

## Tickets

| # | Ticket | Depends on |
| - | ------ | ---------- |
| 01 | Public render applies the editor defaults | — |
| 02 | Top bar layout drives its content row | 01 |

## Verification

Manual acceptance happens in the Header region editor and on a local published
site: a Top bar with `justify-content: center` centres a Heading at every
viewport; `align-items: flex-start` moves it to the top instead of leaving it
centred; a gap separates two blocks; switching the bar to a grid at desktop lays
the blocks out on the authored tracks; hiding the bar at mobile removes the
strip from the live page and leaves the ghost placeholder in the canvas; an
empty bar publishes nothing; a dismissible bar keeps its close button on the
trailing edge without covering the text. Every block dropped in the canvas
renders the same markup once published.
