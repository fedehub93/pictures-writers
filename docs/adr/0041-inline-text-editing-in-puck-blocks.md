# Inline text editing in the Puck text blocks

**Status**: accepted (revised - drag and the caret corrected by [0042](./0042-text-editing-mode-and-the-canvas-lock.md))

The text of a block used to be authored in the sidebar: `Text` was a plain `textarea` rendered
with `whitespace-pre-line`, and `Heading` was already a rich text field but with
`contentEditable: false`, so its formatting menu lived in the properties panel. Authoring
therefore happened away from the place the text appears, unlike the Elementor workflow the
product is measured against. Puck 0.24 supports the workflow natively — `contentEditable: true`
on a `richtext` field makes Puck render a Tiptap editor in place of the prop value and host the
field's `renderInlineMenu` in the block's action bar — so this is an adoption, not a new editor.

`Heading` and `Text` both get `contentEditable: true`, explicitly, because 0.24 defaults it to
`true` while the published docs still say `false`
(`packages/core/lib/field-transforms/default-transforms/rich-text-transform.tsx`). Their Content
field is hidden from the sidebar with `visible: false`, which Puck honours only when drawing the
sidebar: the canvas transform reads the raw field descriptor, so the value stays editable on the
block. Authoring and formatting therefore have one surface, as in Elementor, and the sidebar keeps
typography, dimension and layout.

`Heading` gains a `level` field (H1–H6, default H2) and emits a real heading element, so the block
that is named after a heading is one. `Text` becomes rich text and its root stops being a `<p>`.

**The toolbar is the block's, not the selection's.** Puck renders `renderInlineMenu` inside the
action bar anchored to the block's top-right, while the editor has focus, regardless of whether
anything is selected (`packages/core/components/DraggableComponent/index.tsx`). There is no
selection-anchored bubble in 0.24. The word-level menu Elementor shows is the one part of that UX
this decision does not reproduce.

## Considered options

- **A selection bubble built on Tiptap's `BubbleMenu`.** It is the reference UX, and
  `@tiptap/extension-bubble-menu` is already a dependency. Rejected for now: the bubble only
  exists if we replace Puck's rich text field transform, which also replaces the static render
  path, so we would own the editor lifecycle, the store sync, the overlay portal and the public
  renderer — a module, not a control. Recorded as the evolution to revisit, not as a prohibition.
- **A custom field transform for rich text.** It would also fix the `<div>` wrapper described
  below, since we would render the published markup ourselves. Rejected for the same reason, plus
  the server path: Tiptap's `generateHTML` needs a DOM, which is why Puck's own render falls back
  to injecting the stored HTML raw during SSR. A custom renderer would have to solve that on day
  one.
- **`textarea` with `contentEditable: true` for both blocks.** Cheapest, and it keeps the stored
  value a plain string. Rejected: no bold, no link, no lists — the three things the workflow is
  wanted for.
- **Keeping the sidebar field as a fallback.** Two editing surfaces for one value, with different
  menus (the sidebar gets the full `renderMenu`, the canvas gets `renderInlineMenu`). Rejected:
  the inconsistency it prevents is smaller than the one it creates, and re-showing the field is a
  one-line change if the canvas path ever breaks.
- **`Heading` as a `<div>` with the heading level chosen inline** (the Elementor *Text* model).
  Valid HTML, but it makes the level a property of the text rather than of the block, and it
  collapses `Heading` and `Text` into two presets of one block. Rejected: the fixed tag is the
  only thing that justifies two blocks.
- **Sanitising the stored HTML on save.** Puck does not sanitise: the static render injects the
  value with `dangerouslySetInnerHTML`, and the SSR fallback injects it raw
  (`packages/core/components/RichTextEditor/components/RenderFallback.tsx`). Rejected for now: the
  only write path is the editor, whose schema normalises pasted markup, and authored links are
  already allow-listed twice (`isSafeRichTextHref` in `src/puck/fields/rich-text/link.ts`, plus a
  schema render that degrades an unsafe href to a `<span>`). A sanitizer would be a second,
  drifting description of what the schema allows. It becomes mandatory the day a non-editor write
  path appears — import, generation, or an API client.

## Consequences

- **The editor wrapper is a `<div>`, and it lands inside the heading.** In the canvas Puck
  substitutes the prop with a `<div data-puck-overlay-portal>` holding its editor container and a
  `.rich-text` box; the published path substitutes the editor container and `.rich-text` without
  the portal attribute. Either way a `Heading` that emits `<h2>` contains a block-level div, and
  the rich text inside it is a `<p>`. That is outside the heading's content model. Browsers do not repair it (only `<p>` has automatic closing), SSR keeps the
  element intact, and crawlers read the heading text, so the tag still does what it is for; the
  markup is not something a hand-written page would have. This is the price of a real heading with
  inline editing, and it is the reason `Text` keeps a `<div>` root instead of a `<p>`.
- **The Content field is rich text everywhere, including storage.** `Text` values become HTML.
  Existing plain strings keep working: no tags means Puck wraps the value in a paragraph at render
  time, and `white-space: pre-wrap` keeps literal newlines visible, so no migration ships with
  this. The few production blocks that rely on it are re-authored by hand.
- **Formatting needs CSS the project does not have.** Tailwind's preflight zeroes the margins and
  the list styles, and the paragraph spacing that exists today is scoped to Puck's sidebar editor
  variant only. The rich text container therefore gets paragraph rhythm, list markers and heading
  scale in `puck-base.css`; the heading scale is expressed in `em` so it follows the block's
  responsive font size ladder. This corrects a `Heading` with several paragraphs that, until now,
  rendered with no gap between them on the published page.
- **Link and colour popovers must open inside the canvas iframe.** The block toolbar is portalled
  into the iframe body; a Radix popover that portals into the parent document opens at the wrong
  coordinates, outside the frame. The popovers take an explicit container, and the browser probe is
  what settles it — a happy-dom test does not reproduce the iframe.
- **Empty blocks stay in the DOM.** The block renders the rich text container whether or not it
  has text, in both paths, because ADR-0040 forbids markup that differs between canvas and page and
  a block that renders nothing has no root to select. The canvas shows a placeholder through CSS;
  on the page an empty block contributes an empty, zero-height element.
- **Reaching the value has a single path.** Without a sidebar field, the link and colour controls
  exist only in the block toolbar, so a regression there removes a capability rather than an
  alternative. The field's `visible` flag is the documented way back.
- `inline: true`, the `dragRef` on the block root, and the style-variable pipeline are untouched,
  and selection and the overlay still resolve to the root. Drag did not: this ADR assumed a
  descendant editor left it alone, but a press inside `[contenteditable]` is refused by dnd-kit, so
  a text block could not be dragged at all until a lock and an explicit text editing mode were
  added. ADR-0042 records the measurement and the correction; this ADR is not rewritten around it.
  ADR-0040 is referenced, not superseded.
- Terminology: `GLOSSARY.md` → "Inline text editing", "Content field", "Block toolbar", "Heading
  level", alongside "Block root" and "Live source of truth".
