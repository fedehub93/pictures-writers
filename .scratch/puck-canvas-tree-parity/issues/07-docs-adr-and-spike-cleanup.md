---
Status: done
Type: task
Blocked by: 01-width-intent-in-dimension-field, 02-root-zone-carries-root-layout, 03-layout-blocks-inline-roots, 04-dragref-on-remaining-block-roots, 05-position-relative-parity, 06-hidden-block-ghost-without-wrapper
---

# Docs, ADR and spike cleanup

## What to build

Record the decision and remove the scaffolding.

## Acceptance criteria

- [x] `CONTEXT.md`: *Slot wrapper parity* is rewritten. The discrepancy it
      describes (slot wrappers measuring differently, flex/grid properties having
      to travel through a slot `className`) no longer applies to the block tree;
      what remains is that the block root **is** the selection node. Add the terms
      the model now needs: the editor-only root zone, and the block root as the
      element the editor selects, drags and outlines.
- [x] A new ADR (`docs/adr/0040-…`) records: the canvas and the page draw the same
      element tree; block roots are inline components carrying `dragRef`; the root
      zone carries the root layout contract; the published page keeps a clean,
      semantic DOM. It records the two rejected alternatives (publishing the
      wrapper; a context-aware sizing layer) with the measured evidence and the
      reason each was refused, and the risk that `inline` is documented for
      rich-text nodes.
- [x] The throwaway spike route (`src/app/(spike)/`) is deleted, together with
      the `SPIKE ONLY` markers in it.
- [x] No `SPIKE` marker, comment or dead code remains in the block configs, UIs
      and `puck-base.css`.
- [x] `.scratch/puck-slot-layout-parity/spec.md` gains a short pointer to this
      effort in its Further Notes, so the two parity chapters read as one story.
- [x] This spec's ticket table reflects the final state (statuses and any
      follow-up tickets opened during implementation).
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass, and the
      manual checklist in the spec is signed off in the Header region editor and
      on a local published site. `tsc` and `test:run` pass; repo-wide `lint`
      still exits 1 on the 40 pre-existing errors recorded in
      `.scratch/editor-root-entry/issues/01-upgrade-puck-024.md`, none in a file
      this effort touched.

## Notes

- The ADR is the artefact that stops this from being relitigated: the measured
  table (934 vs 1152, align-self inert, 200 vs 10, 1000 vs 10, dx 0 vs dx 40) is
  the evidence that the divergence was structural rather than a per-property bug.
- ADR-0039 (one breakpoint ladder) and ADR-0038 (responsive visibility) are
  referenced, not superseded: the variable/class pipeline they define is exactly
  what makes the two paths comparable.

## Comments

- 2026-11-11 — Implemented. `CONTEXT.md` replaces *Slot wrapper parity* with
  *Block root* (the element that carries the style variables, the containing
  block and, in the canvas, the selection: every block is `inline` and puts
  `dragRef` there) and *Root zone* (the editor-only
  `[data-puck-dropzone="root:default-zone"]` that carries the container half of
  the root layout contract, with no published counterpart).
- `docs/adr/0040-one-element-tree-in-canvas-and-page.md` records the decision:
  same element tree in both paths, inline roots with `dragRef`, the root zone
  contract, `position: relative` on the block root, and the clean published DOM.
  It carries the measured table and the diagnostic that produced it, rejects
  publishing the wrapper and a context-aware sizing layer with their measured
  cost, and states the `inline`-is-for-rich-text risk together with the four
  tripwires that make a Puck upgrade fail loudly.
- ADR-0039's consequence about the canvas still wrapping each block carries a
  dated revision note pointing at ADR-0040; its breakpoint ladder is otherwise
  untouched, and ADR-0038 is not amended.
- Spike cleanup was a no-op, verified rather than assumed: `src/app/(spike)/`
  never existed in `HEAD` (it was a working-tree route during the diagnosis —
  `git log --all -S"SPIKE ONLY"` finds only the spec commit), no `*spike*`
  directory or file remains under `src/`, and a case-insensitive search for
  `spike` in `src/` returns nothing. Tickets 03 and 04 had already promoted the
  only `// SPIKE:` comments into real documentation, so no dead code was left to
  delete.
- `.scratch/puck-slot-layout-parity/spec.md` gains a Further Notes bullet that
  hands the story to this effort and to ADR-0040. This spec's ticket table gains
  a Status column (01–07 done) and states that no follow-up tickets were opened,
  naming the two accepted limitations (`null`-rendering blocks have no root;
  `Icon` has no box for its first tick).
- Verification: `npx tsc --noEmit` clean; `npx eslint src/puck` 0 errors (9
  pre-existing warnings); `npm run test:run` 248 files / 2079 tests pass.
  `npm run lint` still exits 1 on the 40 pre-existing errors recorded in
  `.scratch/editor-root-entry/issues/01-upgrade-puck-024.md`, none in a file this
  effort touched.
- 2026-11-11 — Manual checklist signed off by the maintainer in the Header
  region editor and on a local published site at desktop, tablet and mobile: the
  max-width Container measures the same and `space-between` distributes its
  children in both; `align-self: center` applies in the canvas; a `width: 100%`
  child fills a flex row; `height: 50%` resolves to the same box; a block hidden
  at the current viewport is a selectable ghost; selection, hover, drag, drop,
  reorder and drawer insertion work on every block including nested Containers;
  and the rich-text toolbar in Heading and Text behaves as before. Ticket
  closed.
