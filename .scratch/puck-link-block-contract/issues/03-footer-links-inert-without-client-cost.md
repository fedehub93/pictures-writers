---
Status: needs-triage
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

**Status:** needs-triage

## Acceptance criteria

- [ ] Clicking a link inside a Link list or Copyright block in the footer canvas
      selects the block instead of navigating.
- [ ] The published footer is still rendered on the server: the public render
      configuration points at the server variant, and the canvas is the only
      place that mounts the client one.
- [ ] Canvas and published markup stay identical, so the render-pipeline parity
      test passes unchanged.
- [ ] A regression test asserts the public configuration entry is not the client
      variant, and the published markup carries no editor behaviour.
- [ ] The reason for the second render entry is written where the editor
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
