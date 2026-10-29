# 03: Consent Mode and script order

**What to build:** While Iubenda is enabled, it owns Google Consent Mode: the CMP configuration declares it, the hand-written consent defaults are gone, and the CMP block provably precedes GTM in the public document. When Iubenda is absent or disabled, no consent signals are emitted.

**Blocked by:** 02 (Iubenda end-to-end)

**Status:** done

- [x] The Iubenda configuration exposes a consent-mode option (default on) and passes it to the CMP configuration.
- [x] The hand-written consent-default component is removed from the public layout and from the codebase.
- [x] With Iubenda absent or disabled, no consent signal is emitted; GTM keeps its default behaviour.
- [x] A rendering test asserts the order: CMP configuration, loader, runtime script, then GTM, and that the runtime script is asynchronous.
- [x] GTM remains `afterInteractive` and after the CMP block.
- [x] Page view tracking still queues events when no consent defaults are present.
- [x] A preview smoke confirms no analytics or advertising tag runs before a choice is made, and that the choice persists across navigation.

## Notes

`PublicHeadScripts` owns the head order: `IubendaCmp` first, then the production-gated `GoogleTagManager`. The component test renders into a DOM and asserts the resulting script order plus GTM's `data-nscript="afterInteractive"`.

React 19 hoists `<script async src>`, which moved the Iubenda runtime ahead of the configuration block. The runtime now carries an `itemProp`, which makes React render it in place while keeping the `async` attribute. A static-markup test in `iubenda-cmp.test.tsx` guards that order.

The deleted `ConsentModeDefaults` means the site no longer emits a hand-written default block. When Iubenda is off the site emits no CMP or consent signal, but the Iubenda GTM template must also be paused: otherwise it keeps consent denied with no banner to update the consent state. The preview smoke (banner visible, choices persist, no tags before consent) was completed in Tag Assistant; see Comments.

## Comments

2026-10-27: The original `googleConsentMode: true` payload only sent consent updates. Testing showed the first GA4 request could still run before any consent signal, with `_ga` cookies and no denied `gcs`. The CMP now emits `"googleConsentMode": "template"`; the Iubenda GTM template on Consent Initialization sets the denied defaults and applies the updates. The template must stay active while the integration is enabled, and must be paused when the integration is disabled. See ADR 0031 and `docs/integrations-runbook.md`.

2026-10-29: Preview/production smoke completed in Tag Assistant. Before Accept the Consent tab shows every purpose as `denied`; after Accept the following events show `analytics_storage`, `ad_storage`, `ad_user_data` and `ad_personalization` updated to `granted`. The consent-update event itself can still display the pre-update state; the next navigation/event carries the granted state, which is expected asynchronous GTM behaviour. GA4 requests change from `gcs=G100` to `gcs=G111` and the choice persists across navigation. The Iubenda GTM template is active and the integration emits `"googleConsentMode": "template"`.
