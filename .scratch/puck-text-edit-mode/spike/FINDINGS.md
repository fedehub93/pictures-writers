# Puck 0.24 canvas — text edit mode spike

Seven questions about how the Puck editor canvas behaves in a real browser, to decide whether a
per-block "text edit mode" can be built the way the design assumes: a **locked** block that
selects and drags but does not take the caret, **armed** into editing by an attribute flip plus
CSS without a re-render, entered by a double click, with the caret placed at the click point and
Enter/Escape left to Puck.

Everything below is an observation from headless Chrome driving the real builder on the agent
database. The raw JSON is in `results-full.json`; the driver that produced it is `probe.mjs`.

**Headline: the brief's premise does not survive contact with the browser.** The lock CSS is a
no-op (the caret still lands in the editor), the text still selects, and *no* drag starts from
the text — locked or not — because dnd-kit refuses presses whose target is inside a
`[contenteditable]`. A lock that *does* work turns the text into a drag handle. The remaining
five questions pass, with the caveats recorded per section.

---

## Environment and method

| Piece | Value |
| --- | --- |
| App | Next.js 16 dev server on `http://localhost:3010`, `.env.agent` (`pictures_writers_agent`) |
| Browser | headless Chrome via `scripts/browser-probe.mjs` → `withSession` (CDP) |
| Page | `/admin/pages/0a6ab578-81c9-4bfa-8a63-c575b8da3c4f/builder/` (seeded probe page: Heading "Probe heading" + Text "Probe paragraph") |
| Driver | `.scratch/puck-text-edit-mode/spike/probe.mjs` — one scenario per question |
| Viewport | 1600×1000, builder auto-zoom 76% (`builder.tsx:16-39` fits the canvas to the pane) |

Two environment facts that shape every number:

1. **Port 3000 was taken.** A `npm run dev` (development database) already held the project
   directory, and Next 16 allows one dev server per directory (`.next/dev/lock`). The agent
   server therefore ran from an isolated copy of the app on port 3010, never from the dev
   database. The copy and its `node_modules` junction are deleted after the spike; the recipe is
   in "Reproduce" below. (At the end of the spike that port-3000 server was found stopped — its
   lock released cleanly, its trace files last written at 12:52 — and was restarted with
   `npm run dev` to restore the state the spike started from.)
2. **The initial run was at 11% zoom** (a 762px-wide window), which made a "30px move" a 270px
   canvas move. Every run here emulates 1600×1000 and expresses drag distances in canvas pixels,
   converted through the iframe transform (`hostRect.width / host.clientWidth`).

Drags are sent as `Input.dispatchMouseEvent`: `mousePressed`, a 260ms hold, six `mouseMoved`
steps with `buttons: 1`, then `mouseReleased`. The hold matters: Puck configures dnd-kit's
`PointerSensor` with `Delay(200) + Distance(5)` for a press on the component body
(`.reference/puck/packages/core/lib/dnd/use-sensors.ts:16-19`).

Drag state is read as DOM facts, because `ui.isDragging` is not reachable from outside React:

- `[data-puck-entry][data-puck-dragging]` — set in the same handler that dispatches
  `ui.isDragging: true` (`DragDropContext/index.tsx:766-785`).
- `[data-dnd-dragging]` on the component root — dnd-kit's own marker.
- `[data-dnd-placeholder]`, `[data-puck-line-placeholder]`, `[class*=DropZone--isEnabled]` — the
  drop indicator.
- component order in the canvas after release.

Selection is read as `[data-puck-overlay]` with `isSelected` in its class list (the action bar
Puck portals for the hovered/selected block) plus the sidebar's `Level` field group, and the
pointer is moved out of the canvas before reading so hover cannot stand in for selection.

---

## 1. Does a locked editor still allow a drag?

**Method.** Inject the brief's lock CSS, press on the Heading text, hold, move down 30 canvas px,
release. Four variants to separate the CSS from the mechanism, plus the Text block and a plain
click.

**Observed.**

| Variant | Hit target at the press point | `<p>` inside a contenteditable? | Drag started? | Result |
| --- | --- | --- | --- | --- |
| a. Brief's lock CSS, press on text | `<p>` | yes | **no** (`entryDragging:false`, `dndDragging:0`) | order unchanged; caret lands in the editor (`activeElement` = `.ProseMirror`) |
| b. No CSS at all (control), press on text | `<p>` | yes | **no** | identical to (a) |
| c. Strict lock (`portal` **and** `portal *` → `pointer-events:none`), press on text | `<h2>` block root | no | **yes** (`entryDragging:true`, `dndDragging:1`, `dndPlaceholders:1`) | block moved: heading dropped below the paragraph |
| d. No CSS, 20px top padding on the `<h2>`, press the padding | `<h2>` block root | no | **yes** | block moved |
| e. Brief's CSS + `contenteditable` attribute removed, press on text | `<p>` | no | **yes** | block moved |

Two separate facts fall out of that table:

1. **The brief's CSS does not lock the editor.** `doc.elementFromPoint` still returns the `<p>`
   inside the ProseMirror document: Puck's own stylesheet forces
   `[data-puck-overlay-portal], [data-puck-overlay-portal] * { pointer-events: auto !important }`
   (`.reference/puck/packages/core/lib/overlay-portal/styles.css:1-4`), so the brief's rule — which
   names only the contenteditable element — leaves every descendant hit-testable, and a descendant
   with `auto` stays targetable inside a `none` parent. A click still puts the caret in the text
   and the inline toolbar still appears — the locked state is not reachable with that selector.
2. **Even so, the text does not drag.** dnd-kit's `PointerSensor` refuses the press:
   `preventActivation` returns `isInteractiveElement(target)`
   (`node_modules/@puckeditor/core/node_modules/@dnd-kit/dom/index.js:1918-1926`), and
   `isInteractiveElement` matches `closest('[contenteditable]:not([contenteditable="false"])')`
   (`.../@dnd-kit/dom/utilities.js:334-345`). Variant (e) proves the discriminator: same target
   `<p>`, only the attribute removed, drag starts.

**Plain click (brief's CSS), no movement.** The Heading is selected: action bar present with
`isSelected`, label `Heading`, and it stays after the pointer leaves the canvas; sidebar shows
`Level`; the caret is at offset 13 in "Probe heading" and the inline toolbar (Bold/Italic/
Underline/Add link/Text color) is mounted. The Text block behaves the same (label `Text`, caret
in "Probe paragraph" at offset 15).

**Verdict: does not work — for both halves of the premise.** The CSS neither locks nor prevents
the drag, so it cannot be the basis of a "locked but drag-enabled" state. A lock that actually
works converts the text into a drag handle: with the strict lock, the first press-and-move on the
Heading reorders the page. Puck 0.24 gives no CSS-only way to get "selectable, not draggable,
not editable".

---

## 2. Does a dblclick reach React on the block root?

**Method.** With the lock CSS injected, record `dblclick` (and the click pair) at document
capture, document bubble, `window` bubble inside the canvas; record `event.target` and
`closest('[data-puck-component]')`; then send a real double click (two press/release pairs with
`clickCount` 1 then 2) in the middle of the Heading text. Also inspect where React's delegation
lives and whether a React handler in the canvas runs at all.

**Observed.**

- The double click produces `mousedown`/`mouseup`/`click` ×2 and then **`dblclick` at document
  capture, document bubble and window bubble**, `detail: 2`, `cancelBubble: false`,
  `defaultPrevented: false`. Nothing in Puck stops it: Puck's native listeners on the block root
  are `click`, `mouseover` and `mouseout`
  (`.reference/puck/packages/core/components/DraggableComponent/index.tsx:558-560`), and there is
  no `dblclick` anywhere in `.reference/puck/packages/core`.
- **Target: `<p>` inside the editor**, not the block root and not the editor element —
  `component: "probe-heading"`, `inOverlayPortal: true`, `inEditor: true`. With the brief's lock
  CSS the `<p>` is still the hit target (see Q1), so a dblclick handler on the root would receive
  an event whose `target` is an editor descendant, and would need `closest('[data-puck-component]')`
  to find the block.
- **React does run for canvas clicks**, but not where the DOM suggests: React's root container
  and its delegated listeners (`click: 3`, `dblclick: 2`, `pointerdown: 2`, `mousedown: 2`) are on
  the **top document**; the canvas document, body, entry and editor carry **no** native click
  listeners. A synthetic `button.click()` on the action bar's Duplicate button *inside the
  iframe* still duplicated the block (2 → 3), so React sees canvas events. Conversely, React's
  `onClickCapture` in `rich-text-transform.tsx:56-71` — which calls `preventDefault()` and
  `stopPropagation()` on the wrapper — did **not** mark the `<p>` click as prevented and did not
  stop it: `defaultPrevented` stayed `false` at the canvas document bubble.
- Consequence: treat "native listener in the canvas" and "React handler on the block" as two
  independent channels. The native channel is reliable and unstoppable-free; the React channel
  runs but its `preventDefault`/`stopPropagation` do not appear on the native event object.

**Verdict: works, with a target caveat.** A `dblclick` listener in the canvas sees the event with
the full bubbling path. Do not expect `event.target` to be the block root (it is the `<p>` inside
the editor), and do not expect React's synthetic prevention/stopping to influence the native
event that your listener sees.

---

## 3. Do CSS + `data-text-editing` flip a block from locked to editable without a re-render?

**Method.** Inject the lock CSS, read the computed `pointer-events` and the hit target; inject
`[data-puck-component][data-text-editing] [contenteditable="true"] { pointer-events: auto !important }`
after it, set `data-text-editing` on the Heading root with `setAttribute`, click a character in the
text, then read `document.activeElement` and the selection inside the canvas.

**Observed.**

| | Before arming | After arming |
| --- | --- | --- |
| `data-text-editing` on `<h2>` | absent | `getAttribute` returns `""` |
| computed `pointer-events` on `.ProseMirror` | `none` | `auto` |
| computed `pointer-events` on its `<p>` | `auto` | `auto` |
| hit target | `<p>` in editor | `<p>` in editor |
| active element after click | `body` | `.ProseMirror` (`contenteditable="true"`, focused) |
| caret | none (`rangeCount: 0`) | collapsed at offset 3 in "Probe heading" |
| toolbar | none | Bold/Italic/Underline/Add link/Text color in the action bar |

The style flip is immediate, with no React re-render: the attribute and the stylesheet do all the
work, and the caret lands on the clicked word.

**Verdict: works — but it proves less than it looks.** The flip is real and re-render-free, yet
the computed style it flips (`none → auto`) changes nothing about hit-testing, because the `<p>`
was already `auto` and clickable while "locked". Arming is therefore only load-bearing *after* the
lock is made to actually cover the editor's descendants — and that is the same lock that makes
the text a drag handle (Q1). Design the lock and the arm as one mechanism, not two.

---

## 4. Does a programmatic focus open Puck's inline editing?

**Method.** Strict lock (so a click selects the block and leaves the caret outside), click the
Heading once, move the pointer away, then call `.focus()` on the `.ProseMirror` element and read
the action bar.

**Observed.**

| | After selecting the block (no caret) | After `editor.focus()` |
| --- | --- | --- |
| action bar | selected, actions `Duplicate`, `Delete` only | `Bold`, `Italic`, `Underline`, `Add link`, `Text color`, `Duplicate`, `Delete` |
| `currentRichText` proxy (inline menu mounted) | absent | **present** |
| `document.activeElement` (canvas) | `<h2>` block root | `.ProseMirror`, `contenteditable="true"` |
| `document.activeElement` (top) | `iframe` | `iframe` |

So focus alone sets `currentRichText` and mounts the toolbar: `useSyncedEditor` listens to
Tiptap's `focus` (`lib/use-synced-editor.ts:76-87`) → `onFocusChange` in
`RichTextEditor/components/Editor.tsx:40-65` writes `currentRichText` → `DraggableComponent`
renders `LoadedRichTextMenu` in the action bar for the matching block
(`DraggableComponent/index.tsx:787-789, 844-854`). Focus stays inside the iframe.

**Verdict: works, with two caveats.**

- The toolbar only appears if the block's action bar is already mounted (hover or selection) —
  `DraggableComponent/index.tsx:583-593, 796`. Focus on a block nobody selected will set
  `currentRichText` but show nothing.
- `.focus()` with no position put the caret at offset 0, not where the user clicked. Pair it with
  a caret placement (Q5) if the caret must land at the pointer.
- Blur does not necessarily clear the toolbar: `EditorInner.tsx:61-76` clears `currentRichText`
  only when `relatedTarget` is set, so `activeElement.blur()` leaves the toolbar mounted (seen in
  an earlier run of this scenario).

---

## 5. Does the caret land at the click point?

**Method.** In the canvas, compute the rect of the word "heading" in "Probe heading"
(`Range.getBoundingClientRect`), ask `document.caretRangeFromPoint` and
`document.caretPositionFromPoint` for that point, then set the DOM selection from the range,
focus the editor and read the selection back.

**Observed.**

- `caretRangeFromPoint(x, y)` → `startContainer: #text` "Probe heading", `startOffset: 9`, rect
  at the character (`width: 0`, `height: 19`), **inside the editor**.
- `caretPositionFromPoint(x, y)` → `offsetNode: #text`, `offset: 9`, inside the editor. Both APIs
  agree.
- Click point was the centre of the word (index 6, width 8.18px/char → the click fell between
  "head" and "ing"). Expected offset computed from the same point: 9. After
  `selection.addRange(range)` + `editor.focus()`: collapsed selection at offset **9** inside the
  editor — **0 characters off**, and it survives the focus.
- `document.activeElement` is the ProseMirror div afterwards.

**Verdict: works exactly.** No correction needed for the caret; `caretRangeFromPoint` is enough
(one API is enough; use the range, not the legacy position, for the rect).

---

## 6. Enter on a selected block — drawer, insert, or nothing?

**Method.** Two states. (A) Strict lock, so a click selects the Heading with the caret outside the
editor; (B) default behaviour, so the caret is in the text. Press Enter once, wait, compare.

**Observed.**

| | A. selected, caret outside (strict lock) | B. selected, caret in the editor (default) |
| --- | --- | --- |
| block order | unchanged | unchanged |
| `[data-puck-dragging]` / `[data-dnd-dragging]` | false / 0 | false / 0 |
| drawer (`[class*=Drawer]`) | 41 before, 41 after | 41 before, 41 after |
| `[role=dialog]` | 0 before, 0 after | 0 before, 0 after |
| action bar | still selected, no text toolbar | still selected, text toolbar |
| focus | still the `<h2>` root | still the editor |
| heading HTML | unchanged | **changed**: `<p>Probe heading</p>` → `<p>Probe heading</p><p data-placeholder="Add a heading" class="is-empty"><br class="ProseMirror-trailingBreak"></p>` |

In state A the block root carries `tabindex="0" role="button"
aria-describedby="dnd-kit-description-N"` (dnd-kit's accessibility attributes), so it is focusable
and Enter targets it — but Puck configures **no KeyboardSensor**
(`lib/dnd/use-sensors.ts:58-77` only adds `PointerSensor`), so nothing starts a drag, and Puck has
no Enter handler in core (`grep -n "Enter" .reference/puck/packages/core` finds only
`InlineTextField/index.tsx:121` and an unrelated `onMouseEnter`). Nothing opens, nothing moves.

**Verdict: works — Enter does nothing, as long as the caret is not in the editor.** In state B the
editor swallows Enter and inserts a paragraph break *inside the heading text*, which is Tiptap, not
Puck. That is the state a "locked" block must genuinely avoid: Enter inside a heading is a silent
content edit.

---

## 7. Escape on a selected block, and whether a capture listener can pre-empt it

**Method.** Three runs, each: click the Heading once, move the pointer off the canvas, install
`keydown` listeners at the canvas document (capture and bubble) and on the block root (bubble),
press Escape, compare selection and the action bar. (A) default CSS, caret in the editor.
(B) strict lock, caret outside. (C) strict lock plus a capture-phase listener on the canvas
document that calls `event.stopPropagation()`.

**Observed.**

| | A. default | B. strict lock | C. strict lock + capture stop |
| --- | --- | --- | --- |
| selected before / after | true / **true** | true / **true** | true / **true** |
| action bar actions after | Bold…Delete, unchanged | `Duplicate`, `Delete`, unchanged | `Duplicate`, `Delete`, unchanged |
| active element before / after | editor / editor | `<h2>` root / `<h2>` root | `<h2>` root / `<h2>` root |
| drawer / dialogs | 41 / 0 unchanged | 41 / 0 unchanged | 41 / 0 unchanged |
| Escape seen at | document capture → root bubble → document bubble | document capture → root bubble → document bubble | document capture → spike capture only |
| `defaultPrevented` | false → **true** at the root bubble → true | false → false → false | false |
| `cancelBubble` | false throughout | false throughout | none below the capture listener |

**What Puck does on Escape: nothing.** It does not deselect, does not close the drawer or a
dialog, does not blur the editor, does not clear `currentRichText` (the toolbar stays mounted).
There is no `Escape` string anywhere in `.reference/puck/packages/core`; the only Escape handling
in the stack is dnd-kit's `PointerSensor.handleKeyDown`, which calls `actions.stop({ canceled: true })`
for an **active drag** and is bound only while a drag is in progress
(`node_modules/@puckeditor/core/node_modules/@dnd-kit/dom/index.js:2068-2073`, bound at
`2113-2119`). The `defaultPrevented: true` in run A comes from the focused editor
(ProseMirror/Tiptap), which prevents the default but neither stops propagation nor deselects.

**Phase: there is no Puck Escape listener to have a phase.** Selection lives in the app store and
is only written by canvas clicks (`DraggableComponent/index.tsx:441-473`), the preview's own click
handler (`Puck/components/Preview/index.tsx:111-120`) and the sidebar. Nothing on Escape.

**Capture pre-emption (run C): structurally yes, practically unnecessary.** A capture-phase
`keydown` listener on the canvas document that calls `stopPropagation()` does pre-empt every
listener below it: no root-bubble event and no document-bubble event were recorded, so any
bubble-phase handler Puck (or the block) might add later would never see the key. It keeps the
block selected — but so does doing nothing, because nothing deselects today. If a product
requirement says "Escape leaves Text editing mode", that handler does not exist yet and has to be
written.

**Verdict: works (nothing happens) — but the "capture can pre-empt Puck" idea is untested against
a real handler, because Puck has none.** Treat capture-phase key handling as available, not as a
proven guard against a future Puck behaviour; the proof only covers listeners registered below
the capture listener.

---

## Source references

Puck source is the `.reference/puck` clone (v0.24.0); dnd-kit is the copy nested under
`@puckeditor/core`.

| Fact | Where |
| --- | --- |
| Block root is the dnd-kit sortable; no drag handle by default | `.reference/puck/packages/core/components/DraggableComponent/index.tsx:270-301` |
| Drag sensors and activation constraints (Delay 200 + Distance 5, mouse body) | `.reference/puck/packages/core/lib/dnd/use-sensors.ts:12-19, 47-81` |
| Drag can start from the element or a handle | `.reference/puck/packages/core/components/DragDropContext/index.tsx:332-342` |
| `ui.isDragging: true` + `data-puck-dragging` on the entry | `.../DragDropContext/index.tsx:749-787` |
| PointerSensor ignores presses inside `[contenteditable]` | `node_modules/@puckeditor/core/node_modules/@dnd-kit/dom/index.js:1896-1927, 1983-1990` |
| `isInteractiveElement` selector list | `.../@dnd-kit/dom/utilities.js:334-345` |
| Overlay portal forces `pointer-events: auto !important` on itself and descendants | `.reference/puck/packages/core/lib/overlay-portal/styles.css:1-4` |
| Overlay portal stops `pointerdown` 200ms after focus | `.../lib/overlay-portal/index.tsx:22-43` |
| Block root `pointer-events: auto`, children `none` | `.../components/DraggableComponent/styles.css:1-13` |
| Native click listener on the block root; selection; `stopPropagation` unless inside the portal | `.../components/DraggableComponent/index.tsx:441-473, 555-560` |
| Focus → `currentRichText` → inline menu in the action bar | `.../RichTextEditor/components/Editor.tsx:40-65`; `.../DraggableComponent/index.tsx:787-789, 844-854` |
| Tiptap `focus` event drives `currentRichText` | `.../RichTextEditor/lib/use-synced-editor.ts:76-87` |
| Blur clears the toolbar only with a `relatedTarget` | `.../RichTextEditor/components/EditorInner.tsx:61-76` |
| Inline editor wrapper: `onClickCapture` sets selection, `registerOverlayPortal({ disableDragOnFocus: true })` | `.../lib/field-transforms/default-transforms/rich-text-transform.tsx:56-80, 100-113` |
| Only `pointermove` is re-dispatched out of the iframe | `.../components/Puck/components/Preview/index.tsx:15-66` |
| Click on the preview background clears the selection | `.../components/Puck/components/Preview/index.tsx:111-120` |
| No `dblclick` handler in Puck core | `grep -rn "dblclick" .reference/puck/packages/core` → no matches |
| No `Escape` handler in Puck core | `grep -rn "Escape" .reference/puck/packages/core` → no matches |
| dnd-kit cancels an active drag with Escape | `.../@dnd-kit/dom/index.js:2068-2073, 2113-2119` |
| KeyboardSensor starts on Space/Enter (not configured by Puck) | `.../@dnd-kit/dom/index.js:1623-1633, 1641-1680` |

---

## Reproduce

```bash
# agent database, probe user, probe page
npm run agent:env
npm run agent:seed

# the agent app must be the one the spike talks to (it refuses anything else)
npm run dev:agent            # http://localhost:3000, .env.agent

# every scenario (screenshots are written to spike/screens/ and are not committed)
node --env-file=.env.agent .scratch/puck-text-edit-mode/spike/probe.mjs \
  --only q1,q2,q3,q4,q5,q6,q7

# one at a time
node --env-file=.env.agent .scratch/puck-text-edit-mode/spike/probe.mjs --only q1
```

`probe.mjs` signs in through `/api/auth/sign-in/email` with `PROBE_ADMIN_EMAIL` /
`PROBE_ADMIN_PASSWORD` from `.env.agent`; it never reads `BETTER_AUTH_SECRET`. The base URL
defaults to `http://localhost:3010` and can be overridden with `SPIKE_BASE_URL`.

### What this machine needed

`npm run dev:agent` refused to start: port 3000 was held by a `npm run dev` (development
database) and Next 16 keeps one dev server per project directory (`.next/dev/lock`). Starting the
agent server from the same directory is impossible while that server runs, so the spike ran from
an isolated copy:

```powershell
robocopy . .scratch/puck-text-edit-mode/app /E /NFL /NDL /NJH /NJS ^
  /XD "C:\P\pictures-writers\node_modules" "C:\P\pictures-writers\.next" ^
      "C:\P\pictures-writers\.git" "C:\P\pictures-writers\.reference" ^
      "C:\P\pictures-writers\.scratch" "C:\P\pictures-writers\docs" ^
      "C:\P\pictures-writers\tests" "C:\P\pictures-writers\perf" ^
      "C:\P\pictures-writers\.vercel" "C:\P\pictures-writers\.agents" ^
      "C:\P\pictures-writers\.github" /XF tsconfig.tsbuildinfo
New-Item -ItemType Junction -Path .scratch/puck-text-edit-mode/app/node_modules `
  -Target C:\P\pictures-writers\node_modules
# .env.agent in the copy: BETTER_AUTH_URL / NEXT_PUBLIC_APP_URL -> http://localhost:3010
cd .scratch/puck-text-edit-mode/app; $env:PORT=3010; node scripts/dev-agent.mjs
```

The copy (including its `.env`/`.env.local` copies) is deleted at the end of the spike; nothing
outside `.scratch/puck-text-edit-mode/` was written.

---

## Risks worth carrying into the design

1. **A working lock makes the text a drag handle.** The most important finding. Any lock that
   removes the editor's descendants from hit-testing leaves the block root as the press target,
   and a 200ms + 5px press-move reorders the page (strict lock: heading dropped below the
   paragraph, `dndDragging: 1`, no confirmation). A text block that arms on click but still drags
   is worse than today's behaviour.
2. **The brief's CSS locks nothing.** Hit-testing still lands on the `<p>`; the caret enters the
   text and the inline toolbar mounts. Any UI that says "locked" while this CSS is what enforces
   it will be lying, and Enter inside the "locked" heading inserts a paragraph (Q6 B).
3. **No drag is not a property of the lock.** It is dnd-kit's `[contenteditable]` guard. It
   protects every text block today, and disappears the moment the attribute does (Q1 e) — e.g. a
   future "plain text" block or a non-editable render path.
4. **Enter in the editor silently edits content** (extra `<p data-placeholder>` inside the
   heading). Enter is only safe while the caret is outside the editor.
5. **Escape does nothing today.** If leaving text mode needs Escape, that handler has to be
   written; there is nothing to pre-empt.
6. **React's synthetic prevention is not visible to native listeners in the canvas** (Q2): a
   native listener sees an un-prevented event even though React's capture handler on the editor
   wrapper called `preventDefault`/`stopPropagation`. Do not mix the two channels in one guard.

---

## Artifacts

| File | Contents |
| --- | --- |
| `probe.mjs` | the seven-question driver (login, scenarios, CDP input, screenshots) |
| `react-probe.mjs` | where React listens (top document) and a synthetic click that proves React handles canvas clicks |
| `results-full.json` | every scenario's raw answer |
| `screens/q*.png` | before/during/after for each scenario, written by a run and not committed — the numbers they show are quoted per question above |

The `diag` scenario inside `probe.mjs` is the pointer-event trace used to prove the press reaches
the block root; it is kept with the driver because it is what makes the Q1 conclusion checkable.
