# One breakpoint ladder for authoring, CSS and the navbar

**Status**: accepted (revised - the Image default is a natural size; see the revision note below)

The header exposed three different responsive scales. Responsive visibility hid a block with `max-width: 1024px` (tablet) and `767px` (mobile). The NavbarBlock collapsed to its hamburger with Tailwind's `md`, which is 768px. The editor's viewport selector bucketed widths by canvas size, and the tablet canvas was really 766px because a 1px border sat outside its 768px box. The visible symptom: hiding the call to action "on tablet" removed it from 1024px down, while the inline menu stayed until 767px, so between 768 and 1023 the header was missing a control without having collapsed. The canvas compounded it: at the "Tablet" setting it rendered mobile CSS, because 766 is below 768.

We keep one ladder — mobile 0–767, tablet 768–1023, desktop 1024+ — and make every surface read it. `src/puck/utils/breakpoints.ts` is the only table: the media queries in `puck-base.css` use those exact numbers, the viewport selector maps widths to buckets instead of canvas sizes, and a unit test fails if the stylesheet drifts. The canvas wrapper draws its frame with a ring rather than a border, so the iframe is exactly the selected width and the media queries inside it describe the selected breakpoint.

The NavbarBlock does not get a global rule. It carries a per-instance menu collapse point (`mobile` or `tablet`) chosen in its Navigation section and expressed with the same bucket names, defaulting to tablet. That is the one component whose breakpoint is a design choice rather than a style value, because a menu has its own "does not fit" threshold; the choice stays legible in the block panel and cannot introduce a fourth width.

Two implementation details follow from the canvas being an iframe. Media queries inside the iframe evaluate against the canvas width, so the hidden-block placeholder can be scoped by the same media queries; an attribute on the editor shell outside the iframe cannot reach the canvas and was silently dead. And because the iframe mirrors the admin styles, the preview root overrides the three tokens that change measurements — spacing, radius and typeface — so the canvas measures like the public site while the admin chrome keeps its own compact scale.

`Dimension` on the Image block now describes the block box, and the picture fills that box. Previously the box was hard-coded to `w-full` and only the picture carried the authored width: on the public page an inline image claimed a whole flex row and squeezed the text next to it, while the canvas hid the effect behind Puck's per-block wrapper. Every stored image already declares a width, so the change is confined to layouts where the image is a flex child; new images default to `100%` so a freshly dropped picture still fills its container.

**Revision (2026-11-11).** A freshly dropped image now keeps its natural size;
`100%` stays one authored Dimension value away. The old default preserved the
full-width box that used to be hard-coded. Default props now also reach the
public render (see `.scratch/puck-slot-layout-parity/`), so keeping `100%` would
apply it to every stored document that never declared a width and stretch the
images placed in a flex row on the published page too. Natural size keeps the
authoring behaviour honest without restyling existing pages.

## Considered options

- **Keep the navbar at 768px and redefine tablet as 768–1023** (status quo). Rejected: the two controls still disagree, because hiding "on tablet" fires at 1023 while the hamburger waits for 767.
- **Collapse every navbar below desktop.** Rejected as a global rule: a site with two links does not need a hamburger at 900px. The per-instance collapse point keeps the default and lets the author decide.
- **Two buckets only (mobile/desktop).** Rejected: Dimension, Typography and Decoration are authored per tablet today, and dropping the bucket would silently change existing documents.
- **Marker attribute on the editor shell for the hidden-block placeholder.** Rejected: the canvas lives in an iframe and only `html`/`body` attributes are mirrored, so the selectors never matched. The media query is the same signal with no cross-document coupling.
- **Unify spacing, radius and font globally.** Rejected: the admin chrome is deliberately denser than the public site. Only the preview root opts into the public tokens.
- **Keep `w-full` on the Image box and special-case the header.** Rejected: it leaves the canvas lying about every inline image and hides the trap for the next author.

## Consequences

- A block hidden at tablet and a navbar collapsing at tablet now switch at the same width.
- Choosing "mobile" on a navbar deliberately reintroduces the 768–1023 band where the menu is inline; the panel states the two widths.
- The canvas gains Figtree, so its text metrics match the published page; the admin bundle carries one extra font.
- The canvas still wraps each block in Puck's own wrapper. A block that relies on being a direct flex child cannot be simulated, so blocks must stay intrinsic and express their width through `Dimension`. **Revised 2026-11-11:** the wrapper is gone; every block is `inline` and carries the drag ref on its own root, so the canvas draws the same tree as the page (ADR-0040). The breakpoint ladder itself is unchanged.
- Terminology: `CONTEXT.md` → "Breakpoint", "Canvas", "Menu collapse point".
