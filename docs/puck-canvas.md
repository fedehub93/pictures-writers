# The Puck canvas in this project

Puck 0.24 renders the editor canvas into an iframe (`#preview-frame`) and treats each block's
root element as the thing it selects, drags and outlines. The canvas is therefore structurally
different from the published page, and a change that looks right in one can be wrong in the
other.

Read these in order:

- `docs/adr/0040-one-element-tree-in-canvas-and-page.md` — why the two paths draw the same tree.
- `docs/adr/0042-text-editing-mode-and-the-canvas-lock.md` — why a text block is locked, and the
  Puck rule the gate compensates for.
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
anchor spreads it: `InlineSmartLink` for the Button block and the NavbarBlock entries,
`ImageBlockUi` for a linked image. The Footer's server-rendered blocks (Link list, Copyright)
reach the same handler through an editor-only render: their `index.tsx` passes
`puck.isEditing`, while the public entry keeps calling the shared server-safe render (Copyright
through its server renderer), so the published footer still ships no JavaScript for them.

## Canvas and page emit the same markup

`puck.isEditing` may change behaviour, never markup. `render-pipeline.test.tsx` compares the
editor config and the render config on the same tree; `canvas-link-inert.test.tsx` compares the
canvas against the published and server-rendered output for the blocks that carry editor state.
The published page has no editor attributes and no wrapper. `data-text-editing` is the same kind of
attribute: it names the one block in text editing mode and is written only in the canvas, so at
rest a text block's markup is the page's.

## Inline text editing

`Heading` and `Text` write their text on the block itself, not in the sidebar. Both mount the
shared `richtext` field from `src/puck/fields/rich-text/` with `contentEditable: true` and
`visible: false`: Puck draws no control for the field, so size, spacing, typography, layout and (on
`Heading`) the level stay in the sidebar and the text does not. The field is still declared in
the descriptor — the canvas transform reads the raw field, only the sidebar honours `visible`.
Re-showing the sidebar field is the way back from a canvas regression; `createRichTextField` is
the one place that decides both flags.

A text block has two states, because the editor Puck mounts permanently would otherwise swallow
every press (ADR-0042):

- **Locked text block** (default): the editor's descendants are out of hit-testing, so a click
  selects the block, a long press with movement drags it like any other block, and no caret enters
  the text. `Enter` does nothing until the block is selected; on a selected block it opens the
  mode.
- **Text editing mode**: the caret is live where you clicked and the editor is normally editable.
  Enter it with a double click on the text, `Enter` on the selected block, or the action bar's
  **Edit text** button; leave it with `Esc`, **Done**, a click on another block or a press on the
  page background. One block at a time is in the mode, and neither a new session nor the
  interactive preview inherits it. The button is the entry that always works on touch, where a
  double tap belongs to the browser's zoom.

The lock is a stylesheet rule keyed to an editor attribute, not markup. `puck-base.css` §7 removes
the pointer from `[data-puck-overlay-portal]` **and every descendant** of a text block, because
Puck forces `pointer-events: auto !important` on both; the armed rule gives it back when the block
root carries `data-text-editing`. The attribute is written imperatively from the editor store, only
in the canvas, and only while that block is armed — so arming does not re-render the block, and at
rest the canvas emits the same markup as the page.

Inside the mode the editor is Puck's, not ours. It holds the caret and Puck sets
`currentRichText`, which mounts `renderInlineMenu` in the block's **action bar**, anchored to the
block's top-right, for as long as the field has focus. There is no menu anchored to the
selection — a word-level bubble is the evolution ADR-0041 records, not this implementation.
`Heading`'s toolbar is bold, italic, underline plus link and colour; `Text` adds
`HeadingSelect` and `ListSelect`. Each block's allowed extensions live in `presets.ts` and are
imported by the public render config too, so a keyboard shortcut cannot produce markup the
published page resolves differently.

Leaving the mode hands the editor back to Puck: the block root takes the focus (Puck clears the
toolbar only on a blur that names a `relatedTarget`) and the DOM selection is collapsed. The block
stays selected, so a second `Esc` — or a click elsewhere — deselects it. The action bar override
also hides the formatting toolbar whenever the block is not armed, because Puck's richtext state
outlives the block and undo/redo would otherwise bring a toolbar back on a locked block. While the
caret is live, the action bar's drag handle is the way to move the block: dnd-kit refuses presses
inside `[contenteditable]`, so the grip (`dnd.enableDragHandle`) is the only drag in that state. The
drag moves the focus out of the iframe editor, so the block stays in the mode but the caret and
toolbar come back with the next click in the text.

The editor is a descendant of the block root, never the root:

- `Text`'s root is a `<div>`. A `<p>` cannot contain Puck's block-level editor wrapper or the
  authored paragraphs.
- `Heading`'s root is the real `<hN>`, and in the canvas Puck's wrapper
  (`<div data-puck-overlay-portal>` around its editor container and a `.rich-text` box) lands
  inside it with a `<p>` around the text. That is outside a heading's content model, but
  browsers do not repair it, SSR keeps the element intact and crawlers read the heading text.
  It is the price of a real heading with inline editing; ADR-0041 records the trade-off.

The toolbar is part of the action bar, which Puck portals into the canvas iframe. The link and
colour panels must portal there too: `getRichTextMenuPortalContainer(editor)` returns the body
of the editor's document, and both panels carry `data-puck-rte-menu`, the marker Puck checks on
blur to keep the toolbar mounted while focus moves into a panel. A panel portalled into the
parent document opens at the wrong coordinates, outside the frame. Puck's own `HeadingSelect`
and `ListSelect` menus are the exception: they portal into the editor window, but they are
anchored to the action bar and therefore still land above it, so they do not need a container.

`.puck-rich-text` on both roots supplies the authored rhythm in `puck-base.css`: paragraph gaps,
list markers and indent, and the `em` heading scale that follows the block's font. An empty
block renders its container in both paths — the root must stay selectable — but only the canvas
shows the hint, because `@tiptap/extension-placeholder` draws it as an editor decoration and
never writes it to the document. On the page the empty container has zero height.

## Verify in a browser

A happy-dom test that does not reproduce Puck's listener passes on broken code — the first
canvas-link fix shipped that way. `mimicPuckSelection` in `canvas-link-inert.test.tsx`
reproduces the listener for the unit tests; a real browser run is still what settles a canvas
change:

```
node scripts/browser-probe.mjs --url <builder> --frame preview-frame --target a --text Blog
```

`docs/agents/browser-probe.md` covers the flags and the report; `--frame` is how the probe
reaches into `#preview-frame`. The inline editing flow needs several actions in one run (click, type,
select, toolbar, save), so a multi-step flow imports `runProbe` or drives CDP directly; the
probe's single-action run is enough for the link and colour panels.

### Upgrade checklist

Use this after every Puck upgrade. It is the interactive half of the contract that the tests can
only pin structurally; a failed step means the upgrade is not acceptable yet. Open a page with a
`Heading` and a `Text` block in the builder:

- [ ] Click the Heading: the block is selected, no caret enters the text, the block action bar
      appears at its top-right with **Edit text**, and there is no separate selection bubble.
- [ ] Press on the text, hold about 250 ms and move 20 px: the block reorders like any other
      block, with a drop indicator as it travels (the text is the drag handle, not a dead zone).
- [ ] Double click a word: the caret lands inside that word, the formatting toolbar appears in the
      action bar and the button says **Done**. `Enter` on the selected block opens the same state,
      and with the caret live the action bar's grip drags the block — the drag takes the focus, so a
      click in the text brings the caret and toolbar back.
- [ ] `Esc` leaves the mode: toolbar unmounted, block still selected, focus on the block root,
      selection collapsed; a second `Esc` deselects. A click on another block or on the page
      background also leaves the mode, and only one block is ever in it.
- [ ] The sidebar shows `Level`, `Layout`, `Size`, `Spacing` and `Typography` for the Heading, and
      `Layout`, `Size`, `Spacing`, `Typography` for the Text — no text field.
- [ ] Bold, italic and underline apply from the toolbar and survive a click outside the text.
- [ ] The link panel opens inside `#preview-frame`, applies an href, removes it, opens the href
      in a new tab, and writes `target="_blank"` plus `rel="noopener noreferrer"` only when
      "Open in new tab" is checked.
- [ ] The colour panel opens inside `#preview-frame`; a theme colour, a palette colour and a
      custom colour apply to the selection, and "Remove colour" clears it.
- [ ] On the Text block, `HeadingSelect` turns a paragraph into H1–H6 and back; `ListSelect`
      produces a bulleted and a numbered list and turns it back into a paragraph.
- [ ] `Ctrl+B`/`Ctrl+I`/`Ctrl+U` format the selection, while the shortcuts for strike, code,
      blockquote and alignment do nothing (the options are off, not just the buttons).
- [ ] Clearing a block shows "Add a heading" or "Start writing" at the caret; Save, reload, and
      the block is still empty with its hint, and the stored document has no hint.
- [ ] The left column's **Outline** tab scrolls: on a document longer than the column, the layer
      tree scrolls vertically while its header stays put, and the **Widgets** tab still scrolls
      through its own scroll area. This is the one contract that lives in Puck's internals — its
      layers box is a `min-height: 0; overflow: auto` flex child, so the tab it mounts in must be a
      bounded flex column (`src/puck/editor/ui/view/sidebar.tsx`). A happy-dom test cannot see it.
- [ ] Publish and open the page: bold, links, lists, extra paragraphs and the `hN` tag are all
      present, the heading scale follows the block's authored font size, and there is no editor
      wrapper, `data-puck-overlay-portal`, `contenteditable` or placeholder.
- [ ] A cleared block publishes nothing visible: zero height, no hint, no reserved line.

When the docs do not answer an internals question, read Puck's source at the installed version
rather than the bundled chunk. The clone lives at `.reference/puck` (v0.24.0, gitignored): grep it
there. `node_modules/@puckeditor/core/dist` is build output — read it only to confirm what the
installed bundle contains.

```
# once, if the clone is missing
git clone --depth 1 --branch v0.24.0 https://github.com/measuredco/puck .reference/puck
```
