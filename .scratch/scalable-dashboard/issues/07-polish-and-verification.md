# 07: Dashboard polish and verification

**What to build:** The finishing pass: consistent widget states, removal of the legacy dashboard implementation, documentation, and end-to-end acceptance of the whole feature.

**Blocked by:** 02, 03, 05, 06

**Status:** ready-for-human (code complete; browser click-through pending)

- [x] Widget loading, empty, and error states are consistent across all widgets.
- [x] The legacy hardcoded dashboard view and its two bespoke widgets are removed.
- [x] Dashboard docs and the glossary reflect the shipped behaviour.
- [ ] Manual end-to-end acceptance passes: default render by permission, edit/reorder/hide/add, metric selection, Salva/Annulla, and persistence across reload.

## Comments

Delivered:

- `src/modules/dashboard/ui/components/widget-states.tsx` — one set of card-body states shared by every widget: `WidgetLoading` (spinner, `role="status"`), `WidgetError` (identical failure copy), and `WidgetEmpty` (message). All three use the same centred body classes and render inside the widget card, so the card's chrome stays put while a widget loads, fails, or has nothing to show.
- `src/modules/dashboard/ui/components/widget-card.tsx` — the `Suspense`/`ErrorBoundary` now wrap the widget body inside the card (previously they wrapped the whole card in `widget-slot.tsx`), so the loading and error states are uniform and keep the title/icon. `widget-slot.tsx` was removed and the grid/sortable cells render `WidgetCard` directly.
- Fixed a runtime SSR failure found during acceptance: every widget showed "Unauthorized" and React logged "Switched to client rendering because the server rendering errored". The dashboard only prefetches its layout and metrics, so during SSR each widget's `useSuspenseQuery` executed through the *browser* tRPC client against `http://localhost:3000/api/trpc` from the server, without the request cookies. `WidgetCard` now renders its body only once mounted in the browser (`useIsClient`), showing the shared loading state on the server, so widget queries always carry the session cookies.
- `src/modules/dashboard/ui/components/widget-list.tsx` — the operational empty message now uses the shared `WidgetEmpty`.
- `src/modules/dashboard/ui/widgets/trend-widget.tsx` — renders the shared `WidgetEmpty` when the metric returns no points, so analytics widgets have an empty state too.
- Removed the legacy hardcoded implementation: `src/modules/dashboard/ui/components/subscriptions-widget.tsx` and the dead `src/modules/mails/contacts/hooks/use-subscription-stats-query.ts` + its barrel `src/modules/mails/contacts/index.ts` (the `EbooksWidget` was already removed in ticket 05). No references remained.
- `CONTEXT.md` — the "Dashboard widget" and "Widget definition" glossary entries now mention configure/re-add and the optional config schema, matching the shipped behaviour. `docs/adr/0015-...md` gains a paragraph on the config schema and multi-instance behaviour shipped in ticket 06.
- Test-isolation fix found during verification (kept as its own commit, unrelated to the dashboard): `src/modules/automations/server/__tests__/procedures.test.ts` asserted a global run total but relied on per-id cleanup, so a sibling file (`automation-runtime.test.ts`) that leaves runs behind broke it. It now calls `cleanupAutomationTables()` in `beforeEach`. This was reproducible on the base commit.
- Coverage: `src/modules/dashboard/ui/components/__tests__/widget-states.test.tsx` (3).
- Verified: full suite (113 files, 916 tests) green, `npx tsc --noEmit` clean, scoped eslint clean on `src/modules/dashboard` and the touched test file, `npm run build` green.

Notes:

- Every acceptance behaviour is exercised at the logic level: default render by permission (layout merge + registry permission filtering), edit/reorder/hide/add (edit-layout helpers), metric selection (config helpers + registry picker), Salva/Annulla and persistence across reload (saveLayout round-trip against the test database). The one step that provably needs a human is the browser drag/mouse interaction, so the manual-acceptance checkbox is left open and the issue is `ready-for-human` rather than resolved.
