# 03: Consent Mode and script order

**What to build:** While Iubenda is enabled, it owns Google Consent Mode: the CMP configuration declares it, the hand-written consent defaults are gone, and the CMP block provably precedes GTM in the public document. When Iubenda is absent or disabled, no consent signals are emitted.

**Blocked by:** 02 (Iubenda end-to-end)

**Status:** ready-for-human (only the manual preview smoke remains)

- [x] The Iubenda configuration exposes a consent-mode option (default on) and passes it to the CMP configuration.
- [x] The hand-written consent-default component is removed from the public layout and from the codebase.
- [x] With Iubenda absent or disabled, no consent signal is emitted; GTM keeps its default behaviour.
- [x] A rendering test asserts the order: CMP configuration, loader, runtime script, then GTM, and that the runtime script is asynchronous.
- [x] GTM remains `afterInteractive` and after the CMP block.
- [x] Page view tracking still queues events when no consent defaults are present.
- [ ] A preview smoke confirms no analytics or advertising tag runs before a choice is made, and that the choice persists across navigation.

## Notes

`PublicHeadScripts` owns the head order: `IubendaCmp` first, then the production-gated `GoogleTagManager`. The component test renders into a DOM and asserts the resulting script order plus GTM's `data-nscript="afterInteractive"`.

React 19 hoists `<script async src>`, which moved the Iubenda runtime ahead of the configuration block. The runtime now carries an `itemProp`, which makes React render it in place while keeping the `async` attribute. A static-markup test in `iubenda-cmp.test.tsx` guards that order.

The deleted `ConsentModeDefaults` means the site no longer emits a hand-written default block. When Iubenda is off the site emits no CMP or consent signal, but the Iubenda GTM template must also be paused: otherwise it keeps consent denied with no banner to update the consent state. The remaining preview smoke (banner visible, choices persist, no tags before consent) needs a human with a deployed preview.

## Comments

2026-10-27: The original `googleConsentMode: true` payload only sent consent updates. Testing showed the first GA4 request could still run before any consent signal, with `_ga` cookies and no denied `gcs`. The CMP now emits `"googleConsentMode": "template"`; the Iubenda GTM template on Consent Initialization sets the denied defaults and applies the updates. The template must stay active while the integration is enabled, and must be paused when the integration is disabled. See ADR 0031 and `docs/integrations-runbook.md`.
