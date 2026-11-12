---
Status: ready-for-human
Type: task
Blocked by: 02-links-inert-in-the-canvas
---

# 03: Footer links inert without client cost

**What to build:** The Link list and Copyright links are inert in the footer
canvas like every other block link, and the published footer still ships no
JavaScript for them. The editor gets its own render variant; the public render
configuration keeps the server one.

**Blocked by:** 02-links-inert-in-the-canvas (the `editing` seam on the shared
anchor)

**Status:** ready-for-human

## Acceptance criteria

- [ ] Clicking a link inside a Link list or Copyright block in the footer canvas
      selects the block instead of navigating. (cancellation is unit-tested; the
      selection itself needs the browser check below)
- [x] The published footer is still rendered on the server: the public render
      configuration points at the server variant, and the canvas is the only
      place that mounts the client one.
- [x] Canvas and published markup stay identical, so the render-pipeline parity
      test passes unchanged.
- [x] A regression test asserts the public configuration entry is not the client
      variant, and the published markup carries no editor behaviour.
- [x] The reason for the second render entry is written where the editor
      configuration is built, so the next block that needs this does not invent a
      third shape.

## Notes

- The problem: both footer blocks are server components today, and the editor and
  public configurations share one render function. Marking their UI `"use client"`
  would ship the footer's JavaScript to every visitor for the sake of a behaviour
  only the canvas needs.
- The shape to decide and record: an editor-specific render that passes the
  editing flag, while the public entry keeps the server render. Same module in two
  graphs, one markup, no divergence for the parity test.
- Deliberately left `needs-triage`: the ticket is a shape decision before it is
  work, and it depends on ticket 02 landing first.
- The Link block and the NavbarBlock do not need this: both are already client
  components, so 02 costs nothing on the published page.

## Comments

- 2026-11-11 — Opened from the grilling session as the follow-up the maintainer
  asked for: "I would not want the published site to pay for it — will that be
  possible?" It is, and this ticket is the shape.
- 2026-11-12 — Implemented. `LinkList` gained `LinkListEditorRender`
  (`src/puck/blocks/LinkList/index.tsx`), the editor graph's only caller of the
  shared `renderLinkListBlock` with `editing: puck.isEditing`; the public entry
  in `render-config.tsx` keeps `renderLinkListBlock` with the flag omitted.
  `Copyright` already had its editor entry in `index.tsx`; it now forwards
  `editing` through `renderCopyrightBlock` and `CopyrightBlockUi`. Both UIs pass
  the flag to `InlineSmartLink`, which reuses the capture-phase
  `getInertAnchorProps` from ticket 02. No UI module gained `"use client"`, so
  the shared markup module stays in the server graph and the published footer
  still ships no JavaScript for either block. No schema, stored document or
  default props changed. The flag keeps its second, pre-existing role —
  `getLayoutClassNames` draws the hidden-block placeholder — so with an
  authored `display: none` the canvas markup still differs by those editor-only
  classes, exactly as before this ticket; the parity cases author no layout and
  the render-pipeline test is untouched.
- Files: `src/puck/blocks/LinkList/{index,render}.tsx`, `.../LinkList/types.ts`,
  `.../LinkList/ui/link-list.tsx`, `.../Copyright/{index,render}.tsx`,
  `.../Copyright/types.ts`, `.../Copyright/ui/copyright.tsx`,
  `src/puck/config.ts` (the rule for a second render entry), `docs/puck-canvas.md`,
  `canvas-link-inert.test.tsx`, `link-list-block.test.tsx`.
- Verification: `npx tsc --noEmit` clean; eslint on the touched files 0
  errors/warnings; `npm run test:run` 249 files / 2125 tests pass (the
  render-pipeline parity test is unchanged and green). The new mounted cases
  dispatch real clicks through the Footer editor config and reproduce Puck's
  `stopPropagation` listener on the block root; the published Link list is
  mounted through the public config *with* `isEditing: true` and still does not
  cancel, so the public entry cannot carry the canvas behaviour; the public
  Copyright path is the server-rendered markup; and a config assertion pins
  `editorComponents.LinkList/Copyright` to the editor variants while the public
  entries are not that function.
- Remaining for the maintainer (hence `ready-for-human`): one browser click on a
  link inside the Link list and inside the Copyright in the Footer region
  editor, to confirm the block gets selected (Puck's
  `[data-puck-component] * { pointer-events: none }` already makes the block
  root the click target; the unit tests prove the anchor would not navigate,
  not the selection).
