---
Status: ready-for-agent
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

- [ ] A Container, Flex, Grid and Top bar in the canvas have no wrapper element:
      the node carrying `data-puck-component` is also the node carrying
      `puck-layout`/`puck-dim` and the block's style variables.
- [ ] Selecting one of them outlines the block's own box exactly (the overlay
      rect equals the block's `getBoundingClientRect`), not an inflated wrapper.
- [ ] Hover, drag out of a nested Container, reorder inside a slot, and
      insertion from the drawer all still work, verified by hand.
- [ ] An empty Container/Flex/Grid keeps a working drop target and a working
      selection in the canvas.
- [ ] The registry invariant test asserts `inline: true` on every entry of
      `editorComponentConfigs`, so a future block cannot quietly reintroduce the
      wrapper.
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass.

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
