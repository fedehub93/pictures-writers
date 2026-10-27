# 02: Iubenda end-to-end

**What to build:** An admin configures Iubenda from the Integrations page and enables it. The public site then renders the consent configuration and its scripts in the document head, before GTM. When the integration is missing, disabled, or incomplete, nothing is emitted and the public site keeps working. Every change reaches the public site on the next request through on-demand revalidation.

**Blocked by:** 01 (Integration provider descriptor)

**Status:** ready-for-agent

- [ ] The Iubenda form validates `siteId`, `cookiePolicyId`, `lang`, and `autoblocking` (default on), with no credential or connection-test fields.
- [ ] The provider card reports "Configured" or "Not configured" and never mentions API keys.
- [ ] Enabling is blocked until the configuration is complete, both in the UI and server-side.
- [ ] With a complete, enabled configuration the public root layout emits, in order in the head, the inline CMP configuration, the loader selected by the autoblocking flag, and the asynchronous runtime script.
- [ ] With a missing, disabled, or incomplete configuration nothing is emitted and the public page still returns normally.
- [ ] Reading the public configuration never throws for those states.
- [ ] Any integration mutation revalidates the public root layout.
- [ ] Create, update, enable, and disable produce an audit entry, and no secret material appears in it.
- [ ] The CMP renders in development, preview, and production whenever the integration is enabled.
