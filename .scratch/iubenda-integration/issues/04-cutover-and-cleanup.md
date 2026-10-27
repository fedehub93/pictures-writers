# 04: Cutover and custom-scripts cleanup

**What to build:** The old Iubenda entries leave the custom-scripts list without the provider ever loading twice, and the generic script mechanism stops knowing anything about Iubenda. After cutover, the admin can no longer choose a strategy the renderer silently downgrades.

**Blocked by:** 03 (Consent Mode and script order)

**Status:** ready-for-human (only the manual cutover remains)

- [ ] The old Iubenda entries are removed from the custom-scripts list, and the public site loads Iubenda exactly once. *(manual production data step; see Notes)*
- [x] Deployment with the integration disabled is the rollback point: disabling removes the CMP without a deploy.
- [x] The generic public-script component contains no Iubenda URL matching or provider-specific strategy rules.
- [x] `beforeInteractive` is no longer offered as a strategy for custom scripts, and persisted `beforeInteractive` values behave as `afterInteractive`.
- [x] Custom scripts still render only in production.
- [x] Custom-script tests cover strategy degradation and the absence of provider-specific branching.
- [ ] Cutover is verified in preview and production: banner visible, choice persists across navigation, no tag fires before consent. *(manual preview/production smoke)*
- [x] Lint, the full test suite, and the production build pass.

## Notes

`AppScripts` now has one rule, exported as `resolveScriptStrategy`: `beforeInteractive` becomes `afterInteractive`. It no longer inspects script URLs, so Iubenda-shaped sources obey whatever strategy the row stores. The admin strategy select uses `SELECTABLE_SCRIPT_STRATEGIES` (`afterInteractive`, `lazyOnload`, `worker`) and applies the same helper to persisted rows when the form loads, so a stored `beforeInteractive` value is never shown as an unavailable option. The public layout still gates `AppScripts` behind `NODE_ENV === "production"`.

The two remaining items are operational and cannot be done from the repository:

1. Remove the old Iubenda rows from **Settings → Scripts** in the production database *before* deploying this change. The integration already renders Iubenda from the root layout, so leftover rows would load it twice; they also lose their former forced strategies, so an old `iubenda_cs.js` row would degrade to `afterInteractive` and could run after GTM.
2. Deploy with the integration disabled, then enable it in preview and production and smoke-test the banner, the persistence of the choice, and that no analytics/advertising tag fires before consent.

Manual verification performed here: `npm run lint`, `npm run test:run` (188 files / 1527 tests), and `npm run build` all pass.
