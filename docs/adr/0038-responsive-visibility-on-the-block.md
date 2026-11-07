# Responsive visibility lives on the block

**Status**: accepted

The Header region is a flex row of blocks, and one of them — the "Feedback gratuito" call to action — must disappear on mobile without wrapping it in a container, because a wrapper would become a fourth flex child and change the row it is trying to preserve. Hiding a block is therefore a property of the block itself, authored at a breakpoint.

The editor already models every style field per viewport: the Puck toolbar switches the canvas width, and Dimension and Typography edit the selected breakpoint only, emitting `--*-d` / `--*-t` / `--*-m` custom properties that cascade desktop → tablet → mobile. Layout was the exception: it existed only on Container, Flex and Grid, because besides `display` it carries flex and grid controls that only mean something for a block with children. We extend Layout to almost every block instead of introducing a second mechanism: the field is edited on the currently selected viewport, like the other style fields, and `display: none` is the hiding mechanism. No toggle row, no separate "visibility" prop, no duplicated cascade. On blocks without children the panel shows the display control only; flex and grid controls are withheld because they could not have an effect.

The cascade is desktop-first and inherited: tablet falls back to desktop and mobile to tablet, then desktop. A block hidden on mobile with no tablet value stays visible on tablet. Each block that exposes Layout applies a display class only when a value exists, because `display: var(--disp-d)` with nothing authored resolves to `inline` and would break blocks whose own layout is expressed with flex classes. The existing `.puck-layout` class keeps its behaviour for containers; leaf blocks get a display-only variant so that the two cannot collide.

In the canvas a block hidden at the current breakpoint is still drawn, as an editor-only placeholder with a dashed outline and a label, so it stays selectable and the editor never loses it while switching viewports. The public render applies `display: none`, so the block occupies no space and is not read by assistive technology. Puck's built-in Outline is untouched: it has no per-instance label API, and it stays data-driven, so the block remains listed there even when hidden.

## Considered options

- **A dedicated visibility field with three mobile/tablet/desktop toggles.** Rejected: it duplicates the viewport switcher the editor already has, gives the same concept two authoring models (toggles next to the viewport-scoped Dimension and Typography), and the toggles need their own inheritance rules on top of the existing ones.
- **Hide by wrapping the block in a Container.** Rejected: it changes the row's child structure, which is exactly the thing being designed, and the wrapper then participates in `justify`, gaps and width calculations.
- **Keep Layout on containers only** (status quo). Rejected: it forces the wrapper for the header's common case, and the wrapper's own layout is then influenced by the block it was supposed to isolate.
- **Layout everywhere, including flex and grid controls on blocks without children.** Rejected: controls that cannot have an effect are a correctness trap; the panel adapts to the block instead.
- **Filter hidden blocks out at render time (do not ship their payload).** Rejected: this is a presentation decision with no security or targeting meaning, and filtering would change cache keys and the document contract for a purely visual outcome.

## Consequences

- `layout` becomes a prop that most blocks can carry. Documents saved before this change are unaffected: an absent value produces no display rule.
- The display rule must be opt-in per authored value, so the public and canvas renderers share one implementation without regressing blocks whose internal layout is flex.
- The same variables drive the canvas and the public site; the editor placeholder is chrome and must never leak into the public output.
- Hidden content still ships to every visitor and is still in the document. This is a layout affordance, not content targeting or access control.
- Visibility belongs to blocks, so a future region key or page block inherits the behaviour without new wiring.
- Terminology: `CONTEXT.md` → "Block layout", "Responsive visibility", "Hidden at the current viewport".
