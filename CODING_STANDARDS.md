# Coding standards

`AGENTS.md` is the implementation-facing half — imports, module layout, directives, commands. This
file is the review-facing half: the judgement calls no tool can settle. It is read while reviewing
a diff, and a reviewer cites the rule beside the line it applies to.

**Mechanical rules live in tooling.** ESLint (`eslint.config.mjs`), `tsc`, Vitest,
`check:doc-citations` and `.github/workflows/test.yml` decide everything a machine can decide; this
file does not repeat them. A rule here that could become a check should become one, and then leave
this file.

## How a review uses this file

- Read the diff first, then the rules whose subject it touches. Do not apply the file front to back.
- Name the rule and the line: "breaks *Contracts*: canvas and page markup" beats "this feels wrong".
- Separate a broken contract — hard, with evidence in the diff — from a judgement call, where the
  trade-off is stated so the author can disagree with it.
- A finding the author cannot satisfy without new tooling is a tooling change, not a review comment.

## Contracts the code must not break

These are the invariants the other decisions are built on. Breaking one is a finding even when the
tests pass.

1. **Canvas and page draw one tree** (ADR-0040). `puck.isEditing` may change behaviour, never
   markup: no editor wrapper, editor attribute or selection helper in published output. A block root
   stays the element Puck selects and drags — `inline: true` and `dragRef` on the root. Pointer:
   `docs/puck-canvas.md`.
2. **Authored style travels as inline variables** (ADR-0043, ADR-0044). Authored values reach the
   Block root as Style variables, and both render paths call the same getter in
   `src/puck/utils/get-style-vars.ts`. A stylesheet rule never competes with an inline declaration.
   Absence means inherit, so a fallback to an older stored shape resurrects a value the author
   deleted: reject it.
3. **The box is one reset scope.** `.puck-dim` resets and consumes size and spacing on one element
   (`src/puck/styles/puck-base.css`), and an authored empty `size`/`spacing` object is what
   suppresses a block default. `defaultProps` apply in the canvas only; the public path applies
   defaults through the shared helper.
4. **One breakpoint ladder** (ADR-0039). The numbers live in `src/puck/utils/breakpoints.ts`; a new
   media query, or a Tailwind breakpoint that disagrees with it, is a finding.
5. **Freshness is explicit** (ADR-0001). A write that changes published content calls
   `revalidatePath`; the deployment is single-instance and its caches are in memory.
6. **The admin surface is guarded per page.** `requireAdminAuth()` on every admin page and route,
   and the two auth configurations (`src/lib/auth.ts`, `src/shared/lib/auth.ts`) stay in sync.
7. **Identifiers are never request data.** Raw SQL uses tagged templates, and table, column and
   `ORDER BY` names come from a closed allow-list (`src/shared/lib/lock-root.ts`). ESLint bans the
   unsafe APIs; the allow-list itself is a review job.

## Boundaries

- **Server first.** A component is a server component until it needs interaction, and only then
  imports `"client-only"`; a module that must never reach the client imports `"server-only"`. Check
  what a new client component pulls into the public bundle, and whether the feature already has a
  client seam instead.
- **Match the live pattern.** tRPC (`src/trpc/routers/_app.ts`) and App Router route handlers
  (`src/app/api/`) both exist. Use the one the feature already uses; introducing a third is a
  finding, not a preference.
- **The vendored primitives are not edited.** `src/shared/ui/` is the vendor's surface, so a change
  belongs in the call site or in a module that wraps it: a local patch is erased the next time the
  component is reinstalled.
- **The editor's properties panel owns its controls' box and fill.**
  `src/puck/components/panel-control.tsx` is the one place a panel control takes its size and its
  background from. A new control reads `PANEL_CONTROL` instead of choosing a background, because the
  panel draws controls both on its own surface and inside `bg-muted/60` groups: a fill that is left
  to the surface changes shade between sections.
- **Public bundle discipline** (ADR-0028, ADR-0029). No explicit prefetch, third-party scripts stay
  `afterInteractive`, and a new dependency on a public path needs a bundle reason.

## Data and migrations

- A schema change ships its migration, and the generated client is never committed.
- A one-off data migration is a pure transform plus a dry-runnable runner with a per-row report,
  idempotent and outside the request path — `src/puck/migrations/migrate-size-spacing.ts` is the
  shape to copy.
- Migrations survive a rolling deploy (expand/contract). A change where code and stored data change
  shape together states its rollout order and what clears the caches; see ADR-0044 and
  `docs/self-hosting/08-operations-runbook.md`.

## Tests

- A test states its invariant in its name and asserts what an editor or visitor observes — emitted
  variables, a report entry, rendered markup — not a private helper.
- A bug fix arrives with a test that fails without the fix.
- Tests run only against `.env.test`, guarded by `tests/test-db.ts`; a test that reads the
  development database is a finding.
- When a contract has two paths, the test compares them: `src/puck/__tests__/render-pipeline.test.tsx`
  compares the editor and render configs on one tree.

## Comments, names and docs

- A comment names the constraint, the measurement or the rejected alternative. It does not narrate
  the code: a comment that restates the statement beside it is deleted, not shortened.
- Names come from `GLOSSARY.md`; drifting to a listed *Avoid* synonym is a finding.
- A decision that binds later work gets an ADR following `docs/adr/README.md` — next number, status
  line, considered options, consequences. Historical ADRs are records: a correction is a revision
  note, and a later decision links back to what it changes.
- The guide that owns a contract is updated in the same change (`docs/puck-canvas.md` for block
  interaction, the glossary for vocabulary). `check:doc-citations` proves a cited path exists, not
  that the prose beside it is still true — that part is a review job.

## Commits and tickets

- One logical change per commit; the message says why, not which files moved.
- Close a ticket the way `docs/agents/issue-tracker.md` says, and keep that commit to the ticket
  file alone.

## When this file and the code disagree

The code is right only until someone writes the correction down. A rule that no longer matches the
repo is updated in the change that made it stale, and a rule the tools now enforce is removed here
rather than left as sediment.
