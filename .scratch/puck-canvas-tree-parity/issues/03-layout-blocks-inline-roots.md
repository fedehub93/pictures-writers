---
Status: done
Type: task
Blocked by: 01-width-intent-in-dimension-field, 02-root-zone-carries-root-layout
---

# Layout blocks render without the editor wrapper

## What to build

Puck inserts an unstyled `<div data-puck-component>` around every block while
editing. That div becomes the flex/grid item, so the block stops being what its
parent lays out and the canvas measures differently from the published page.

Declare `inline: true` on the blocks that own a slot — Container, Flex, Grid and
the Top bar — and attach Puck's `dragRef` to the block's own root, which for
these blocks **is** the slot: forward it to `<Items>`. Puck then uses the slot
element as the drag handle, the selection anchor and the overlay source.

The comments left over from the spike (`// SPIKE: …` in the block configs) are
promoted to real documentation of why the flag is there.

## Acceptance criteria

- [x] A Container, Flex, Grid and Top bar in the canvas have no wrapper element:
      for the container blocks the node carrying `data-puck-component` is also
      the slot carrying `puck-layout`/`puck-dim` and the block's style
      variables; for the Top bar it is the strip root carrying
      `puck-layout-item`/`puck-dim` and the root style variables (the container
      layout surface already moved to the slot in the previous ticket).
- [x] Selecting one of them outlines the block's own box exactly (the overlay
      rect equals the block's `getBoundingClientRect`), not an inflated wrapper.
- [x] Hover, drag out of a nested Container, reorder inside a slot, and
      insertion from the drawer all still work, verified by hand.
- [x] An empty Container/Flex/Grid keeps a working drop target and a working
      selection in the canvas.
- [x] The registry invariant test asserts `inline: true` on every entry of
      `editorComponentConfigs`, so a future block cannot quietly reintroduce the
      wrapper. Until ticket 04 migrates the leaves, the test accounts for the
      remaining wrapped blocks through an explicit punch list instead.
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass. `tsc` and
      `test:run` pass; repo-wide `lint` still exits 1 on the 40 pre-existing
      errors recorded in `.scratch/editor-root-entry/issues/01-upgrade-puck-024.md`,
      none in a file this ticket touches (`npx eslint src/puck` reports 0
      errors).

## Reference implementation

Verified in the spike on Container (selection overlay landed exactly on the
block: `64,48 1152×80` against a block rect of the same size).

Config, one line per component:

```ts
export const ContainerBlock: ComponentConfig<ContainerBlockProps> = {
  // The block's own slot element is the node Puck selects, drags and outlines.
  // Puck's `inline` branch is the only supported way to skip its wrapper.
  inline: true,
  fields: { /* unchanged */ },
};
```

Render passes the ref down, the UI puts it on the slot element:

```tsx
// render.tsx
<ContainerBlockUi Items={Items} dragRef={puck?.dragRef} … />

// ui/container-block-ui.tsx
export const ContainerBlockUi = ({
  Items, styleVars, layoutClassName, dragRef,
}: {
  Items: SlotComponent;
  styleVars: Record<string, string>;
  layoutClassName?: string;
  /** Editor-only: Puck's drag/selection ref, attached to the slot element. */
  dragRef?: ((element: Element | null) => void) | null;
}) => (
  <Items
    // The slot element is the block's root, so this is what makes the block
    // selectable without an editor-only wrapper div.
    ref={dragRef as never}
    className={cn("puck-layout puck-dim puck-typo puck-deco", layoutClassName)}
    style={styleVars}
  />
);
```

`SlotProps` omits `ref` from its type even though DropZone and Slot forward it to
their element at runtime, hence the narrow cast. For leaf blocks the same prop
goes on the element that already carries `puck-dim`, with no cast needed.

## Notes

- Mechanism, from `@puckeditor/core` 0.24: `dist/index.js:12152` renders the
  component directly when `componentConfig.inline` and hands it
  `puck.dragRef`; the wrapper branch is the fallback. `overrides` exposes no
  wrapper key, so this flag is the only supported way to skip it.
- `<Items ref>` works because DropZone and Slot forward a `ref` to their element
  in this version. `SlotProps` omits `ref` from its type, so the container UI
  needs a narrow cast with a comment.
- The blocks still rendering with a wrapper after this ticket are handled in
  ticket 04; a mixed state is fine, leaves are auto-sized and do not show the
  difference.
- Interactive verification cannot be automated in this repo; the manual
  checklist in the spec is part of the acceptance.

## Comments

- 2026-11-11 — Implemented. `Container`, `Flex` and `Grid` declare
  `inline: true` and render `src/puck/components/slot-surface.tsx`, a new shared
  component that replaces the three byte-identical `*-block-ui.tsx` files: the
  slot element carries the root classes, the style variables and Puck's
  `dragRef` in a single expression. `TopBar` declares `inline: true` and forwards
  `puck.dragRef` through `TopBarBlockUi` to the strip root.
- The Top bar's root is the strip `<div>`, not its slot: the previous ticket
  moved the container layout surface to the slot, so the element that carries
  `puck-dim` and the root style variables is the strip. The ref therefore goes
  on the strip, exactly as ticket 04's note requires ("do not attach the ref to
  a wrapper the block renders for its own layout — the Top bar slot"). Outlining
  the strip is also what the author expects: that is the box the parent lays out.
- The narrow cast the reference implementation expected is not needed on
  `@puckeditor/core` 0.24: `DropZoneSharedProps` already types `ref?: Ref<any>`,
  and React 19 passes `ref` to the slot function as a normal prop. The DOM test
  pins where the block puts the ref; that Puck's slot forwards it to its element
  is Puck's contract, verified in the canvas by the manual checks below. The
  shared ref type lives in `src/puck/types.ts` (`BlockDragRef`).
- No `// SPIKE:` markers were left in `HEAD` to promote; the comment on each
  config and the `SlotSurface` doc block are the documentation this ticket asked
  for, including the rich-text caveat an upgrade has to be checked against.
- `src/puck/__tests__/inline-roots.test.tsx` mounts each of the four blocks
  through its editor config with a spy `dragRef` and asserts that the callback
  receives the host's only child, and that this element carries the root classes
  (`puck-layout …` for the container blocks, `puck-layout-item puck-top-bar …`
  for the bar). It also pins the empty Container/Flex/Grid case. A DOM render is
  required because refs are only invoked on the client.
- The registry invariant is an accounting test: every entry of
  `editorComponentConfigs` is either `inline: true` or on an explicit
  `WRAPPER_REMOVAL_PENDING` punch list. A new block that forgets `inline` lands
  in neither and fails; ticket 04 empties the list, at which point the test
  asserts `inline` on every entry with no allow-list.
- The consolidated render-pipeline test now passes a `dragRef` to the editor
  render as well, so parity also covers the version of the props the canvas
  receives. Where the ref lands is asserted by the DOM test, because the wrapper
  itself is created by Puck's canvas item and never appears in this markup.
- Verification: `npx tsc --noEmit` clean; `npx eslint src/puck` 0 errors;
  `npm run test:run` 247 files / 2042 tests pass. `npm run lint` still exits 1 on
  the 40 pre-existing errors recorded in the sibling ticket, none in a file this
  ticket touches.
- 2026-11-11 — Canvas checks done by the maintainer in the Header region editor
  (the only palette that offers all four blocks). All four give the same shape:
  the node Puck selects is the node carrying `puck-layout`/`puck-layout-item`,
  `puck-dim` and the block style variables, its parent is a drop zone (never a
  wrapper), and the selection overlay rect equals the block rect. A Container
  authored with `max-width` and auto margins measures its own centred box, not
  the full canvas. Hover narrows to the child, a nested Container keeps working when
  dragged in and out, reorder inside a slot shows the insertion line, insertion
  from the drawer works both at the root and into an empty slot, and an empty
  Container/Flex/Grid keeps its drop target and its selection. The Top bar is
  selectable from the strip background and reorders at the root. Ticket closed;
  the only box left unticked is the repo-wide `lint` failure recorded above,
  accepted as pre-existing and outside this ticket.
- The parent spec's Verification repeats the interaction checks at desktop,
  tablet and mobile; those are part of the spec's final gate, not of this
  ticket's acceptance, and are best re-run once tickets 04–06 have landed.
- Known follow-up, by design: the hidden-block ghost in `puck-base.css` keys off
  `[data-puck-component]:has(> .puck-hidden-placeholder)`. For the four blocks
  made inline here the placeholder class now sits on the same element as
  `data-puck-component`, so that selector stops matching. Ticket 06 rewrites it
  for the new tree; the blocks stay hidden and rendered, only the dashed ghost
  is missing until then.
