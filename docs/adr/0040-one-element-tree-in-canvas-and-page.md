# One element tree in the canvas and on the page

**Status**: accepted

The editor canvas and the published page were drawing different element trees, so a layout could be right in one and wrong in the other with no authored value out of place. Two editor-only elements were responsible. Puck wrapped every block in an unstyled `<div data-puck-component>`, which became the flex or grid item, so the block was no longer the thing its parent laid out. And Puck rendered the document's root content into its own zone element, a block-level `div` with no published counterpart, so the top-level blocks were children of a block box in the canvas and children of the root in production.

Measured on the real Header region document — identical stored props, Chrome, desktop breakpoint:

| Case | Published | Canvas |
| --- | --- | --- |
| Container with `max-width: 72rem`, `margin: 0 auto`, no width, in a flex-column root | 934px (shrink to fit) | 1152px (fills) |
| `align-self: center` on a block in a column | applies | inert |
| `height: 50%` of a 400px parent | 200px | 10px |
| `width: 100%` inside a flex row | fills the row | content-sized |
| `position: absolute` child of a block, parent with 40px padding | dx 0 | dx 40 |

Every row comes from the wrapper or the zone, not from a per-property bug: the property is read by a different box in each path, or it is inert because the item is the wrapper. The reported defect was the first row — `space-between` working while authoring and the same blocks bunched after publishing — and the other four would have surfaced next.

The diagnostic was the published header measured at a 1900px viewport, the same document measured inside the editor iframe, and a DOM harness that compared both shapes with and without a wrapper element; every row above was captured that way.

We draw the same tree in both paths. Every block declares `inline: true`, which is the only branch in `@puckeditor/core` 0.24 that skips the wrapper, and attaches `puck.dragRef` to its own root element. Puck then treats that element as the drag handle, the selection anchor and the overlay source. For Container, Flex and Grid the root is the slot, so the ref goes to `<Items>`; for every other block, the Top bar included, it goes to the element that already carries `puck-dim` and the block's style variables (for the Top bar, the strip). The ref and the style-variable map are applied in the same expression, so the element the editor selects cannot drift from the element the layout styles. A shared `SlotSurface` component owns that expression for the slot blocks, and `BlockDragRef` in `src/puck/types.ts` states the rule the layer follows: root element, never a child, never a wrapper the block renders for its own layout.

The root zone gets the container half of the root's layout contract in `puck-base.css`, desktop-first with the same media queries as `.puck-layout`: display, direction and wrap, justify, align, align-content, justify-items, the gaps and the grid tracks. The layout variables are inherited from the root, so the zone only has to read them. `align-self` is deliberately absent, because it still describes the root as a child of its own parent. The rule is editor-only by construction: it targets `[data-puck-dropzone="root:default-zone"]`, an attribute that exists only in the canvas.

A block root is also `position: relative` in both paths. Puck sets it imperatively on the element it owns, which is now the block's root; declaring it for both paths is what makes an absolutely positioned descendant resolve against the same box in the canvas and on the page. `puck-block-root` names that contract, separately from `.puck-dim`, because the Form placeholder is a block root that does not take `.puck-dim`.

The published page keeps a clean DOM: no editor wrapper, no editor attributes, no zone. A container block publishes as its own slot element, a leaf as its own paragraph, anchor or box — the markup a hand-written page would have. Parity is achieved by removing editor elements, not by shipping them.

## Considered options

- **Publish Puck's per-block wrapper.** It guarantees parity, but every published page then carries an editor artefact around every block, and the block permanently loses its ability to be a flex or grid item — the row would lay out the wrapper instead. A page that published the wrapper would reproduce the canvas column above: the header Container at 1152px instead of 934px, `align-self` inert, a 50% height at 10px instead of 200px, a 100% width content-sized instead of filling, an absolute child at dx 40 instead of dx 0. Adding a class to the wrapper would not help: the tree is the difference.
- **A context-aware sizing layer.** Making `auto` resolve from the parent's declared context fixes the reported width default and nothing else. The other four rows stay wrong because the property is still read by the wrapper: `align-self` inert, 10px instead of 200px, content-sized instead of filling, dx 40 instead of dx 0. The style layer would also become a compiler that has to classify every future property against its parent's display mode, and the test matrix would have to pin each classification. Five distinct symptoms from two structural causes is not a shape that per-property patches fix.
- **`display: contents` on Puck's wrapper.** Rejected: it removes the box Puck needs for overlay positioning and drag collision, and an empty drop target with no box cannot be hit. Selection would break to remove a layout lie.
- **A custom canvas renderer that reproduces the published tree.** Rejected: it is a second editor, and Puck's selection, drag and overlay machinery is built around the nodes it owns.

## Consequences

- Selection, hover, drag, drop, reorder and insertion run on the block's own box. The overlay rect equals the block rect (`64,48 1152×80` for the header bar Container), and nested selections still resolve to the innermost block.
- Width semantics become explicit, because the two paths now share `getDimensionVars`: when a breakpoint authors a `maxWidth` and no `width`, the function emits `width: 100%`. A box that caps its width is a centered content area, not a shrink-to-fit label. The Width control offers *Fill* and *Fit content* next to the numeric input; the empty value still means "nothing decided here". No document migration: stored props keep their shape.
- A leaf root that is a text-level box needs a natural width once it is a flex or grid item. `width: auto` on an inline anchor is harmless while the anchor sits in normal flow, but as the item its parent now lays out, it stretches to the row: a Button with a background and padding reads as a bar, and no stored value changed. The Button therefore declares a **block base width** (`fit-content`) on the desktop rung, consumed by the same `getDimensionVars` both paths call. It outranks the implied fill — a natural width has nothing to compensate for — and any authored width at a breakpoint still outranks it, the explicit `auto` included. It is a block constant, not a document default, so existing documents render correctly with no migration; the Width control's *Auto* row names it instead of claiming there is no width.
- The hidden-block ghost keys off `.puck-hidden-placeholder` on the block root instead of a `data-puck-component` direct child. The fade sits on the root, so the box, the dashed outline and the label fade together; the ghost properties are reset on the base rule because they are inherited.
- Blocks that render `null` have no root to attach the ref to (`Brand` without a name or logo, `NavbarBlock` without items, `Button` without a link or label). They were 0×0 before as well, so nothing was pointer-selectable; the Outline still lists them. `Icon` has no box for the first tick, until its glyph chunk resolves.
- The Form "Select a valid form!" placeholder keeps its own `size-full` root and does not take `puck-dim`, because that markup is public too. It still carries the ref and `puck-block-root`.
- The published DOM is smaller than before and semantically clean, which matters for SEO, assistive technology and any CSS written against the page.
- ADR-0039 (one breakpoint ladder) and ADR-0038 (responsive visibility) are referenced, not superseded: their variable and class pipeline is exactly what makes the two paths comparable. The one premise of ADR-0039 that no longer holds — the canvas still wrapping each block — is noted there and replaced by this decision.
- **Risk: `inline` is documented upstream for rich-text inline nodes.** The behaviour relied on here is narrower than the name suggests: skip the wrapper, hand over `dragRef`. A Puck upgrade may change it, so the registry test asserts `inline: true` on every component config, the per-block test asserts the ref lands on the root that also carries the block classes, the render-pipeline test compares both configs on the same tree, and the stylesheet tripwire derives the root-zone selector from the installed package. Those tests fail loudly; the interactive checklist decides whether the upgrade is acceptable in practice.
- The evidence that settled it: the spike route used to measure the shapes was a working tree only and never reached `HEAD`; the numbers above and the comments in `.scratch/puck-canvas-tree-parity/` are what remain.
- Terminology: `GLOSSARY.md` → "Block root", "Block base width", "Root zone", "Canvas", "Live source of truth", "Hidden at the current viewport".
