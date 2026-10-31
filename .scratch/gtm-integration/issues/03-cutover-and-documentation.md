# 03: Cutover and documentation

**What to build:** The production Installation moves from the environment variable to the Integrations row without a silent analytics gap, and no document claims GTM is configured outside the CMS or read at build time.

**Blocked by:** 02 (Public rendering from the integration, environment removal, and the revalidation reader)

**Status:** `done` (manual cutover pending on the operator)

- [x] `docs/integrations-runbook.md` has a "Cutting Google Tag Manager over from the environment" section: deploy with the integration disabled (rollback point), enter the container id in Integrations, enable, verify in Tag Assistant, then remove `NEXT_GTAG_CONTAINER_ID` and `NEXT_GA_TRACKING_ID` from the deployment environment.
- [x] The runbook states that GTM loads after the CMP block and that the Iubenda template stays the consent mechanism.
- [x] `AGENTS.md` no longer lists `NEXT_GA_TRACKING_ID` / `NEXT_GTAG_CONTAINER_ID` among the required variables.
- [x] `docs/self-hosting/appendice-a-variabili-ambiente.md` drops both variables from the reference table and from the example `.env`.
- [x] `docs/self-hosting/04-deploy-applicazione.md` drops them from the deploy variable list and from the build-time prerender warning, which no longer applies to GTM.
- [x] `docs/self-hosting/01-analisi-e-piano.md` and `docs/self-hosting/appendice-b-dockerfile.md` drop their GTM environment entries.
- [x] `docs/adr/0028-no-explicit-prefetch-and-third-party-scripts.md` states that GTM's container id comes from the GTM integration, keeping the `afterInteractive` and CMP-first timing unchanged.
- [x] `docs/adr/0031-consent-provider-in-integrations.md` no longer says GTM renders "in production": it renders whenever the integration is enabled and complete.
- [x] `.scratch/provisioning/issues/01-runtime-configuration.md` records GTM as done and leaves reCAPTCHA and Stripe open.
- [x] `.scratch/offline-purchase-attribution/spec.md` no longer points at `NEXT_GA_TRACKING_ID`: the measurement id and its API secret belong to a future `ga4` provider.
- [ ] Manual cutover performed and verified: container loads after the CMP block, consent defaults are denied before a choice, GA4 page views resume. *(operator step on production; cannot be performed from this repository)*
- [x] `npm run test:run` passes. `npm run lint` still exits 1 on the same 40 pre-existing errors recorded in ticket 02; this ticket changes no file ESLint parses.

## Notes

The cutover has no environment fallback and no backfill script by decision. The gap between the deploy and enabling the integration is a few minutes controlled by the operator, and it buys the removal of a second source of truth for the container id. There is nothing to clean up in **Settings → Scripts**: the current Installation's script list is empty.

The Dockerfile in `appendice-b` is a draft document, not the production build; it is updated for consistency, not because the container reads the variable.

`docs/self-hosting/06-cutover-dns.md` and `07-test-e-verifica.md` keep their GTM checks as operational smoke steps ("container active", "GTM loads"). They stay true after the cutover and do not need rewording.

No new ADR: the decision is ADR 0036 (per-Installation values at runtime) applied to a provider that ADR 0031 already models. ADR 0028 and 0031 are amended only where they assert the old source.

## Comments

Documentation-only change; no application code was touched.

- `docs/integrations-runbook.md` gains the ordered GTM cutover (deploy disabled → enter id → enable → verify in Tag Assistant → remove both variables) plus the CMP-first ordering and Iubenda-template contract.
- Both variables are gone from `AGENTS.md`, `appendice-a` (table + example `.env`; section 3.8 renamed to reCAPTCHA with a pointer to Integrations), `04-deploy-applicazione.md` (deploy list, scope table, prerender warning now naming only `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`), `01-analisi-e-piano.md`, and `appendice-b-dockerfile.md`.
- ADR 0028 now says the container id comes from the `gtm` Integration and that only an enabled, complete integration emits it, keeping `afterInteractive` and the CMP-first order. ADR 0031 says GTM renders when the integration is enabled and complete, in any environment.
- `.scratch/provisioning/issues/01-runtime-configuration.md` records GTM as done (progress table, `affectsPublicSite` reader, render-time read, "Done when", production impact) and leaves reCAPTCHA, Stripe, and the canonical URL open. `.scratch/provisioning/spec.md` no longer lists `NEXT_GTAG_CONTAINER_ID` as a live value in its Solution section; its Problem statement keeps the historical description, now annotated as fixed in the issue.
- `.scratch/offline-purchase-attribution/spec.md` moves the GA4 measurement id and Measurement Protocol API secret to a future `ga4` provider.
- `npm run test:run`: 197 files / 1656 tests passed. `npx tsc --noEmit`: clean. `npm run lint` still exits 1 on the same 40 pre-existing errors reported in ticket 02; this ticket changes no file ESLint parses.
- The manual cutover (last unchecked item) is an operator step in production and remains to be done. It is documented, ordered, and reversible by toggling the integration.
