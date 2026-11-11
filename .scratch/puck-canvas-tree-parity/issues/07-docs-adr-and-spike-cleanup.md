---
Status: ready-for-agent
Type: task
Blocked by: 01-width-intent-in-dimension-field, 02-root-zone-carries-root-layout, 03-layout-blocks-inline-roots, 04-dragref-on-remaining-block-roots, 05-position-relative-parity, 06-hidden-block-ghost-without-wrapper
---

# Docs, ADR and spike cleanup

## What to build

Record the decision and remove the scaffolding.

## Acceptance criteria

- [ ] `CONTEXT.md`: *Slot wrapper parity* is rewritten. The discrepancy it
      describes (slot wrappers measuring differently, flex/grid properties having
      to travel through a slot `className`) no longer applies to the block tree;
      what remains is that the block root **is** the selection node. Add the terms
      the model now needs: the editor-only root zone, and the block root as the
      element the editor selects, drags and outlines.
- [ ] A new ADR (`docs/adr/0040-…`) records: the canvas and the page draw the same
      element tree; block roots are inline components carrying `dragRef`; the root
      zone carries the root layout contract; the published page keeps a clean,
      semantic DOM. It records the two rejected alternatives (publishing the
      wrapper; a context-aware sizing layer) with the measured evidence and the
      reason each was refused, and the risk that `inline` is documented for
      rich-text nodes.
- [ ] The throwaway spike route (`src/app/(spike)/`) is deleted, together with
      the `SPIKE ONLY` markers in it.
- [ ] No `SPIKE` marker, comment or dead code remains in the block configs, UIs
      and `puck-base.css`.
- [ ] `.scratch/puck-slot-layout-parity/spec.md` gains a short pointer to this
      effort in its Further Notes, so the two parity chapters read as one story.
- [ ] This spec's ticket table reflects the final state (statuses and any
      follow-up tickets opened during implementation).
- [ ] `npx tsc --noEmit`, `npm run lint` and `npm run test:run` pass, and the
      manual checklist in the spec is signed off in the Header region editor and
      on a local published site.

## Notes

- The ADR is the artefact that stops this from being relitigated: the measured
  table (934 vs 1152, align-self inert, 200 vs 10, 1000 vs 10, dx 0 vs dx 40) is
  the evidence that the divergence was structural rather than a per-property bug.
- ADR-0039 (one breakpoint ladder) and ADR-0038 (responsive visibility) are
  referenced, not superseded: the variable/class pipeline they define is exactly
  what makes the two paths comparable.
