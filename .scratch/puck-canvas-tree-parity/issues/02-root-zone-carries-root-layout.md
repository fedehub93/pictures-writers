---
Status: ready-for-agent
Type: task
---

# Root zone carries the root layout contract

## What to build

While editing, Puck renders the document's root content into its own zone
element (`[data-puck-dropzone="root:default-zone"]`), a block-level `div` that
has no counterpart on the published page. Because that element is the real
parent of the top-level blocks, the canvas lays the top level out as block flow
while the published page lays it out with the root's flex or grid.

Give the zone the container half of the layout contract, in `puck-base.css`,
desktop-first and with the same three media queries as `.puck-layout`: display,
flex direction and wrap, justify, align, align-content, justify-items, the gaps
and the grid tracks. The layout variables are inherited from the root, so the
rule only has to read them.

## Acceptance criteria

- [ ] In the canvas, a root whose layout is `display: flex; flex-direction:
      column` produces the same top-level arrangement as the published page:
      `justify-content`, `align-items`, `gap` and `grid-template-*` authored on
      the root all reach the top-level blocks.
- [ ] `align-self` is **not** applied to the zone: it still describes the root as
      a child of its own parent.
- [ ] A root with no authored layout keeps the current look (`display: block`,
      full width) in both paths.
- [ ] The tablet and mobile overrides follow the same cascade as `.puck-layout`
      (`--*-t, --*-d`, `--*-m, --*-t, --*-d`).
- [ ] The rule cannot reach the published page: it targets an attribute that only
      exists in the canvas.
- [ ] A tripwire test asserts the selector is present in `puck-base.css`, so a
      Puck upgrade that renames the root zone fails loudly.
- [ ] Manual: a top-level Container with max width and auto margins measures the
      same in the canvas and on the page.

## Reference implementation

Verified in the spike: with this rule in place the canvas reproduces the
published page (a max-width Container with auto margins measured 977px with
151.5px side margins in both, instead of 1152px in the canvas only).

```css
/* --- 0c. ROOT ZONE (editor only) ---
   While editing, Puck renders the document's root content into its own zone
   element, which becomes the real parent of the top-level blocks. The published
   page has no such element: those blocks are children of the root itself.
   Without this rule the canvas lays the top level out as block flow while the
   published page lays it out with the root's flex/grid, so the same document
   measures differently — e.g. a Container with `max-width` and auto margins
   fills its measure in the canvas and shrinks to fit on the live page.

   The layout variables are inherited from the root, so the zone only declares
   the container half of the contract. `align-self` is deliberately absent: it
   describes the root as a child of its own parent, not its content. */
[data-puck-dropzone="root:default-zone"] {
  display: var(--disp-d);
  flex-direction: var(--fd-d);
  flex-wrap: var(--fwrap-d);
  justify-content: var(--jc-d);
  align-items: var(--ai-d);
  align-content: var(--ac-d);
  justify-items: var(--ji-d);
  row-gap: var(--rgap-d);
  column-gap: var(--cgap-d);
  grid-template-columns: var(--gtc-d);
  grid-template-rows: var(--gtr-d);
}
```

Inside `@media (max-width: 1023px)` and `@media (max-width: 767px)`, next to the
existing `.puck-display-t` / `.puck-display-m` rules, the same declaration block
with the matching cascade:

```css
/* tablet */
display: var(--disp-t, var(--disp-d));
flex-direction: var(--fd-t, var(--fd-d));
flex-wrap: var(--fwrap-t, var(--fwrap-d));
justify-content: var(--jc-t, var(--jc-d));
align-items: var(--ai-t, var(--ai-d));
align-content: var(--ac-t, var(--ac-d));
justify-items: var(--ji-t, var(--ji-d));
row-gap: var(--rgap-t, var(--rgap-d));
column-gap: var(--cgap-t, var(--cgap-d));
grid-template-columns: var(--gtc-t, var(--gtc-d));
grid-template-rows: var(--gtr-t, var(--gtr-d));

/* mobile: same, with var(--*-m, var(--*-t, var(--*-d))) */
```

## Notes

- `rootDroppableId` is `root` + `default-zone` in `@puckeditor/core` 0.24
  (`dist/index.js:1446`).
- Do not try `display: contents` on the zone: the root drop target would lose its
  box and dropping at the root would stop working.
