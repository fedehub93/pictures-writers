# 02: Public rendering from the integration, environment removal, and the revalidation reader

**What to build:** The public root layout emits Google Tag Manager from the integration row instead of the environment. Both GTM-related variables disappear from `src/`. The enabled state is the only gate, so GTM renders wherever it is enabled. `affectsPublicSite` finally drives public revalidation. Nothing about the head ordering or the event surface changes.

**Blocked by:** 01 (GTM provider descriptor and admin form)

**Status:** done

- [x] `src/app/(home)/layout.tsx` resolves `resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_GTM)` inside the existing `Promise.all` and `withIntegrationResolutionCache`, and passes `gtmId={gtmConfig?.containerId}` to `PublicHeadScripts`.
- [x] The `NODE_ENV === "production"` condition around the container id is removed: an enabled, complete integration renders in development, preview, and production.
- [x] `PublicHeadScripts` keeps its prop and its output unchanged: the CMP block first, then `GoogleTagManager` with `afterInteractive`.
- [x] A missing, disabled, incomplete, or unreadable GTM row emits nothing and lets the page render normally.
- [x] `grep -rn "NEXT_GTAG_CONTAINER_ID\|NEXT_GA_TRACKING_ID" src/` returns nothing.
- [x] `revalidatePublicIntegrations()` runs only when `descriptor.affectsPublicSite` is true, in `update`, `setEnabled`, and `test` (`server/procedures.ts`). Saving or toggling GTM and Iubenda still revalidates the public root layout through the existing `settings` scope; saving or toggling Resend no longer does; a connection test no longer revalidates.
- [x] Tests: `GET`-style public-config coverage for `gtm` (enabled and complete returns `{ containerId }`; missing, disabled, and invalid return `null` without throwing); the provider list assertions that hard-code two providers become three; the revalidation block asserts GTM and Iubenda yes, Resend no, connection test no.
- [x] The existing head-rendering test still passes untouched, and a case asserts the container id reaches `_next-gtm`'s `src` when provided and that nothing is emitted when it is `null`.
- [x] `npm run lint`, `npm run test:run`, and `npm run build` pass.

## Notes

The layout change is a substitution, not a refactor: GTM already had its own prop and its own component, and the ordering contract from ADR 0031/0028 is expressed by `PublicHeadScripts`, which does not move.

The revalidation reader is the piece that makes "change the container id in the backoffice" take effect on the next request instead of at the next cache expiry. It has to be written here because `affectsPublicSite` is declared on every descriptor and read by nobody: today `revalidatePublicIntegrations()` runs unconditionally for every provider, including Resend, whose configuration is never rendered publicly. The `test` mutation is included in the gate because `lastTestedAt` and `lastTestStatus` are admin-only data; a provider that had both a connection test and public impact would still revalidate.

Removing the `NODE_ENV` gate is intentional and matches Iubenda. Installations that do not want container traffic outside production disable the integration, which is a visible, audited state rather than an environment inference.

`sendGTMEvent` call sites, `PageViewTracker`, the `dataLayer` name, and the Iubenda integration are untouched. Events queue before the container loads and simply never fire when the integration is disabled.

## Comments

Implemented in commit `ae470359`.

- The layout resolves Iubenda and GTM in the same `Promise.all`, each through `withIntegrationResolutionCache`, and forwards only `gtmConfig?.containerId`. The `NODE_ENV === "production"` gate is gone; `AppScripts` keeps its own gate, which is unrelated.
- `revalidatePublicIntegrations(descriptor)` now reads `affectsPublicSite` and is called from `update`, `setEnabled`, and `test`. GTM and Iubenda keep revalidating the `settings` scope; Resend and connection tests do not.
- `grep -rn "NEXT_GTAG_CONTAINER_ID\|NEXT_GA_TRACKING_ID" src/` returns nothing. Documentation and deployment references remain for ticket 03.
- Tests: GTM public-config coverage (complete/disabled/missing/invalid), head-script coverage that the id reaches `_next-gtm`'s `src` and that no GTM markup appears when nothing resolves, and a rewritten revalidation block covering update and toggle for GTM, update and toggle for Iubenda, and no revalidation for Resend saves, toggles, or connection tests.
- `npx tsc --noEmit` is clean, `npm run test:run` passed with 197 files / 1656 tests, and `npm run build` compiled successfully. Repo-wide `npm run lint` still fails on 40 pre-existing errors in files this ticket does not touch; ESLint on every changed file is clean.
- Review (standards + spec, in parallel) flagged two actionable points, both fixed before the commit: an Iubenda `setEnabled` revalidation test had been replaced rather than added, and the `gtmId` prop had been widened to `string | null` even though the layout only ever produces `string | undefined`.
