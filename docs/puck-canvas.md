# The Puck canvas in this project

Puck 0.24 renders the editor canvas into an iframe (`#preview-frame`) and treats each block's
root element as the thing it selects, drags and outlines. The canvas is therefore structurally
different from the published page, and a change that looks right in one can be wrong in the
other.

Read these in order:

- `docs/adr/0040-one-element-tree-in-canvas-and-page.md` — why the two paths draw the same tree.
- `src/puck/types.ts` (`BlockDragRef`) — where a block's root is.
- `src/puck/utils/inert-anchor.ts` — the click contract, in full.
- `.agents/skills/puck` — Puck's own API. Start from `https://puckeditor.com/llms.txt`, then
  fetch the page's `.md`; the skill's `references/` cover integration and troubleshooting.

## The block root

Every block declares `inline: true` — the only branch that skips Puck's wrapper — and attaches
`puck.dragRef` to its own root element. The ref goes on the element that also carries the
block's root classes (`puck-dim`, `puck-block-root`, plus `puck-layout` for the slot blocks),
never on a child and never on a wrapper the block renders for its own layout.

A block whose root is an anchor is the awkward case: the anchor *is* what Puck selects, so it
keeps its `href`, `target` and `rel` while editing.

## Clicks while editing

Puck attaches a native `click` listener to the block root and calls `stopPropagation()` there.
React delegates its handlers to the container the canvas portal renders into, so a bubbling
`onClick` on a block-root anchor never runs and the browser follows the link. The capture phase
runs before that listener and still reaches the browser; `next/link` bails on
`defaultPrevented`.

`getInertAnchorProps(editing)` is the shared implementation. Every block whose root can be an
anchor spreads it: `InlineSmartLink` for the Link block and the NavbarBlock entries,
`ImageBlockUi` for a linked image.

## Canvas and page emit the same markup

`puck.isEditing` may change behaviour, never markup. `render-pipeline.test.tsx` compares the
editor config and the render config on the same tree; `canvas-link-inert.test.tsx` compares the
canvas against the published and server-rendered output for the blocks that carry editor state.
The published page has no editor attributes and no wrapper.

## Verify in a browser

A happy-dom test that does not reproduce Puck's listener passes on broken code — the first
canvas-link fix shipped that way. `mimicPuckSelection` in `canvas-link-inert.test.tsx`
reproduces the listener for the unit tests; a real browser run is still what settles a canvas
change:

```
node scripts/browser-probe.mjs --url <builder> --frame preview-frame --target a --text Blog
```

`docs/agents/browser-probe.md` covers the flags and the report; `--frame` is how the probe
reaches into `#preview-frame`.

When the docs do not answer an internals question, read Puck's source at the installed version
rather than the bundled chunk:

```
git clone --depth 1 --branch v0.24.0 https://github.com/measuredco/puck .reference/puck
```

`.reference/` is gitignored; `dist/index.js` is a single minified chunk.
