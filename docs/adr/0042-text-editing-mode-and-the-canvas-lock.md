# Text editing mode: a locked text block and an explicit edit state

**Status**: accepted

ADR-0041 adopted Puck's inline richtext editor on `Heading` and `Text` and assumed the editor was
harmless to the rest of the canvas: "the editor is a descendant of the root, so selection, drag and
the overlay keep working on the root element". A browser spike measured the opposite, in the real
builder. Puck mounts the editor permanently, and its overlay portal fills the block root, so the
first press lands inside a `[contenteditable]`. dnd-kit refuses exactly those presses
(`isInteractiveElement` matches `closest('[contenteditable]:not([contenteditable="false"])')`,
`@dnd-kit/dom/utilities.js`), so a text block could not be dragged at all while images, links and
containers could. The same permanent mount put the caret in the text on the first click, even when
the intent was to select, and `Enter` with the caret inside a `Heading` inserted a paragraph *inside*
the `<hN>` — a silent content edit nobody asked for.

A text block now has two explicit states, and the state is session state, not document state.

**Locked text block** is the default: the editor is mounted but its descendants are out of
hit-testing, so a click selects the block, a long press with movement drags it like any other
block, and no caret enters the text. **Text editing mode** is entered deliberately — a double click
on the text (with the caret at the clicked word), `Enter` on the selected block, or the action bar's
**Edit text** button — and left with `Esc`, **Done**, a click on another block, or a press on the
page background. One block at a time is in the mode. The button is the entry that always works on
touch, where a double tap belongs to the browser's zoom.

The armed id lives in the editor store (`editingTextBlockId`), next to zoom and preview mode: it is
not persisted, not part of the Puck data, and cleared on editor mount, when the block leaves the
document (delete, undo, root switch) and when the interactive preview is opened. The gate is applied
to editor configs only, in `src/puck/editor-shell.tsx`; the shared registry and the public render
config never import it, so neither the store nor the listeners reach the published bundle.

## Why the lock must cover the portal's descendants

Puck's own stylesheet forces `pointer-events: auto !important` on
`[data-puck-overlay-portal]` *and every descendant* (`packages/core/lib/overlay-portal/styles.css`).
A rule that names only the `[contenteditable]` element therefore locks nothing: the paragraphs are
still hit-testable, the caret still lands in the text, and the editor is as available as before.
The lock has to cover the descendants, and that is the same rule that makes the text a drag handle
— the block root becomes the press target, which is the behaviour wanted. Lock and arming are one
mechanism, in one place (`puck-base.css` §7):

```css
[data-puck-component] [data-puck-overlay-portal],
[data-puck-component] [data-puck-overlay-portal] * { pointer-events: none !important; }

[data-puck-component][data-text-editing] [data-puck-overlay-portal],
[data-puck-component][data-text-editing] [data-puck-overlay-portal] * { pointer-events: auto !important; }
```

`data-text-editing` is written imperatively on the block root while the editor store names the
block, so arming does not re-render the block, does not remount the editor and does not move the
layout. Both rules carry `!important` and outrank Puck's base portal rule by specificity; they tie
at (0,3,0) with Puck's rule for an in-progress drag, where source order decides and the portal's
pointer events no longer matter. The attribute needs `data-puck-component`, which is canvas-only,
so at rest the canvas markup is identical to the published page and the page can never carry the
attribute.

## Why the listeners are native, not React

The spike found React's delegated listeners on the **top** document, while the canvas iframe's
document carries none; React does receive canvas events, but its `preventDefault()` /
`stopPropagation()` on the editor wrapper's `onClickCapture` did not appear on the native event
(`defaultPrevented` stayed `false`). React and native are two independent channels, so the gate
attaches native listeners to the block root it already owns through `puck.dragRef` and never
depends on a React handler seeing the same event.

A `dblclick`'s target is a `<p>` inside the editor, not the block root, so the listener sits on the
root and lets the event bubble to it; it reads the click point from the event, not from the target.
`Enter` and `Esc` are native `keydown` listeners on the canvas document — and on the host document
too, because keyboard events do not cross the iframe and the author may already have moved to the
properties panel.

## Why `Esc` is ours

Puck has no `Escape` handler anywhere in its core (there is no `Escape` string to bind to), and its
only related behaviour is dnd-kit cancelling an active drag (`@dnd-kit/dom/index.js`). There is no
Puck state to pre-empt and no capture-phase guard to write, so both steps of the gesture are ours:
the first `Esc` leaves the mode and keeps the block selected, the second deselects through Puck's
own `setUi` dispatch. `Enter` is ours for the same reason: Puck configures no `KeyboardSensor`, so
the key is free on a selected block.

Leaving the mode is not just dropping the attribute. The block root takes the focus, which is what
Puck needs: its blur handler clears `currentRichText` — and with it the toolbar — only when the
event names a `relatedTarget`, and when the editor was already blurred the gate replays a
`focusout` with the block root as that target. The DOM selection is collapsed at the same time, so
no highlighted word is left without a toolbar.

## Considered options

- **Arm on a single click.** The click that selects would also open the mode, so the caret would
  enter on the first press — the reported defect itself. Rejected.
- **Leave the editor always editable and add only a drag handle.** The grip fixes dragging, not the
  accidental caret or the silent `Enter` inside a heading, and it takes the drag away from the text,
  which is the gesture authors ask for. Rejected.
- **Lock the `[contenteditable]` element only.** Measured as a no-op: Puck re-enables the portal's
  descendants with `!important`. Rejected by the spike, not by argument.
- **A React `onPointerDown` / `onDoubleClick` guard on the block.** The channel does not behave the
  way the DOM suggests (above), and the event the guard needs (`dblclick`) has no Puck handler to
  coordinate with. Rejected in favour of native listeners on the element the gate already owns.
- **A custom field transform or a selection bubble.** The larger ownership ADR-0041 already
  rejected; nothing here changes that decision.
- **An upstream pull request making the two states native in Puck.** Out of scope for this change;
  the gate is deliberately a thin wrapper over published Puck behaviour so it can be deleted when
  that lands.

## Consequences

- **A slow click on a locked block can start a drag.** dnd-kit activates the body with `Delay(200)`
  plus `Distance(5)`, a rule already in force on every other block; a press held that long and moved
  that far reorders the page. A slow double click can likewise become a drag instead of arming,
  which is why the **Edit text** button is part of the model and not a fallback.
- **Dragging from the grip works while the caret is live.** `dnd.enableDragHandle` adds Puck's
  standard drag handle to every action bar the author may drag (`permissions.drag`); Puck keeps the
  body as an activator as well and gives the handle `Distance(5)` with no delay, so neither gesture
  is lost. The grip is Puck's chrome on all blocks, not a text-block variant. The drag itself moves
  the focus out of the canvas editor: the block stays in the mode, and the next click in the text
  puts the caret and the toolbar back.
- **The formatting toolbar is scoped to the mode.** Puck's `currentRichText` outlives the block
  (undo followed by redo brings a text block back with the toolbar already mounted), so the action
  bar override hides `[data-puck-rte-menu]` unless the block is armed. Without it a locked block
  could show a toolbar that formats nothing.
- **The action bar gains an override.** `Edit text` / `Done` reads the Content field descriptor —
  not a list of block types — and hides on a block without one or on a field that permissions or
  read-only make static. All three entries write the same store id, so the button reflects a mode
  opened by a double click or `Enter` too.
- **A future text block inherits the gate.** The wrapper keys off the field descriptor, and the
  registry is not asked to register anything.
- **The published page is unchanged.** No attribute, class or byte of JavaScript is added: the CSS
  is inert without `data-puck-component`, and the gate exists only in the editor config.
- **Invariants worth failing on.** `text-edit-gate.test.tsx` asserts the wrapper contract, the
  markup parity at rest and the two CSS rules (removing one fails the suite);
  `text-edit-lifecycle.test.tsx` asserts the editor-wide resets; `text-edit-action.test.tsx` asserts
  the button decision and the editor wiring. `docs/puck-canvas.md` carries the interactive half —
  the upgrade checklist now has a drag step and a mode step, the two steps that were missing when
  the defect shipped.
- **Evidence.** The spike is `.scratch/puck-text-edit-mode/spike/FINDINGS.md` (seven measured
  questions, screenshots and raw JSON), and it is what changed two premises of the design: the
  first lock was a no-op, and `Esc` did not exist in Puck.
- Terminology: `GLOSSARY.md` → "Text editing mode", "Locked text block", "Inline text editing",
  "Content field", "Block toolbar".
