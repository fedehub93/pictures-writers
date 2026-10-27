# 04: Cutover and custom-scripts cleanup

**What to build:** The old Iubenda entries leave the custom-scripts list without the provider ever loading twice, and the generic script mechanism stops knowing anything about Iubenda. After cutover, the admin can no longer choose a strategy the renderer silently downgrades.

**Blocked by:** 03 (Consent Mode and script order)

**Status:** ready-for-agent

- [ ] The old Iubenda entries are removed from the custom-scripts list, and the public site loads Iubenda exactly once.
- [ ] Deployment with the integration disabled is the rollback point: disabling removes the CMP without a deploy.
- [ ] The generic public-script component contains no Iubenda URL matching or provider-specific strategy rules.
- [ ] `beforeInteractive` is no longer offered as a strategy for custom scripts, and persisted `beforeInteractive` values behave as `afterInteractive`.
- [ ] Custom scripts still render only in production.
- [ ] Custom-script tests cover strategy degradation and the absence of provider-specific branching.
- [ ] Cutover is verified in preview and production: banner visible, choice persists across navigation, no tag fires before consent.
- [ ] Lint, the full test suite, and the production build pass.
