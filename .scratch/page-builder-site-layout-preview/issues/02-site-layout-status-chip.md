---
Status: ready-for-agent
Type: task
Blocked by: 01
---

# Site layout status chip

## Goal

Make it impossible to mistake a draft or default Site region for the published one while looking at the page builder canvas.

## Acceptance criteria

- [ ] When the chrome is visible, a small muted chip appears next to the page title in `BuilderHeader` for every region that is **not live**.
- [ ] Chip text distinguishes the two cases: `Header: bozza` / `Footer: bozza` for a current version that differs from the live one, `Header: predefinito` / `Footer: predefinito` for a region without a live version.
- [ ] Both chips can appear at once (header draft, footer default); when both regions are live, no chip is rendered.
- [ ] The chip is not rendered when the chrome is hidden.
- [ ] Each chip carries a `title` attribute explaining the state: a draft is not visible to visitors until the region is published; the default is the code fallback used until the region is published.
- [ ] Chip text and tooltip come from a pure mapping over `"live" | "draft" | "default"`, so they are unit-tested without rendering the header bar.
- [ ] `npx tsc --noEmit`, targeted ESLint, `npm run test:run`, `npm run build` pass.

## Implementation notes

- The state is already computed by the server query added in ticket 01 (`{ header, footer }` → `state`); pass it through `PuckEditor` to the header bar instead of re-deriving it on the client.
- No polling, no live update: the chip describes the data loaded when the builder opened.
- Keep the visual weight below the page title: `text-xs`, muted, no icon required.
- Announce in `CONTEXT.md` only if the wording introduces a new term; "draft" and "default" are already defined in the domain model.

## Out of scope

- A full layout status panel, per-region publish actions from the page builder, permission-aware CTAs.
