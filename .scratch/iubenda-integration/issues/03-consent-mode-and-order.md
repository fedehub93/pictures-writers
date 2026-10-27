# 03: Consent Mode and script order

**What to build:** While Iubenda is enabled, it owns Google Consent Mode: the CMP configuration declares it, the hand-written consent defaults are gone, and the CMP block provably precedes GTM in the public document. When Iubenda is absent or disabled, no consent signals are emitted.

**Blocked by:** 02 (Iubenda end-to-end)

**Status:** ready-for-agent

- [ ] The Iubenda configuration exposes a consent-mode option (default on) and passes it to the CMP configuration.
- [ ] The hand-written consent-default component is removed from the public layout and from the codebase.
- [ ] With Iubenda absent or disabled, no consent signal is emitted; GTM keeps its default behaviour.
- [ ] A rendering test asserts the order: CMP configuration, loader, runtime script, then GTM, and that the runtime script is asynchronous.
- [ ] GTM remains `afterInteractive` and after the CMP block.
- [ ] Page view tracking still queues events when no consent defaults are present.
- [ ] A preview smoke confirms no analytics or advertising tag runs before a choice is made, and that the choice persists across navigation.
