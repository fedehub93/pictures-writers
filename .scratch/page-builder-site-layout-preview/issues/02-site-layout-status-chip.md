---
Status: resolved
Type: task
Blocked by: 01
---

# Site layout status chip

## Goal

Make it impossible to mistake a draft or default Site region for the published one while looking at the page builder canvas.

## Acceptance criteria

- [x] When the chrome is visible, a small muted chip appears next to the page title in `BuilderHeader` for every region that is **not live**.
- [x] Chip text distinguishes the two cases: `Header: bozza` / `Footer: bozza` for a current version that differs from the live one, `Header: predefinito` / `Footer: predefinito` for a region without a live version.
- [x] Both chips can appear at once (header draft, footer default); when both regions are live, no chip is rendered.
- [x] The chip is not rendered when the chrome is hidden.
- [x] Each chip carries a `title` attribute explaining the state: a draft is not visible to visitors until the region is published; the default is the code fallback used until the region is published.
- [x] Chip text and tooltip come from a pure mapping over `"live" | "draft" | "default"`, so they are unit-tested without rendering the header bar.
- [x] `npx tsc --noEmit`, targeted ESLint, `npm run test:run`, `npm run build` pass.

## Implementation notes

- The state is already computed by the server query added in ticket 01 (`{ header, footer }` → `state`); pass it through `PuckEditor` to the header bar instead of re-deriving it on the client.
- No polling, no live update: the chip describes the data loaded when the builder opened.
- Keep the visual weight below the page title: `text-xs`, muted, no icon required.
- Announce in `CONTEXT.md` only if the wording introduces a new term; "draft" and "default" are already defined in the domain model.

## Out of scope

- A full layout status panel, per-region publish actions from the page builder, permission-aware CTAs.

## Comments

Delivered on `feat-site-region`.

- Pure copy: `src/modules/site-regions/lib/site-layout-status.ts` maps `"live" | "draft" | "default"` to a chip (or `null` for live) per region, reusing `SITE_REGION_LABELS` and deriving the region keys from `SiteLayoutPreview`.
- Rendering: `SiteLayoutStatusChips` draws the muted `text-xs` chips with a `title` tooltip; it renders nothing when the chrome is hidden, the preview payload is missing or both regions are live. Hidden below `md`, like the page title it sits beside.
- Transport: `PuckEditor` now passes `siteLayout` to `Editor`, which passes it to `BuilderHeader`; the server-computed state from ticket 01 is never re-derived on the client.
- Tests: `src/modules/site-regions/lib/__tests__/site-layout-status.test.ts` (per-state copy, both regions, one-sided and live/live cases) and `src/puck/__tests__/site-layout-status-chips.test.tsx` (hidden chrome, no payload, all live, both chips with tooltips, muted styling).

Verified: `npx tsc --noEmit` clean; targeted ESLint clean; `npm run test:run` 238 files / 1966 tests passed; `npm run build` passed.
