# 02: Iubenda end-to-end

**What to build:** An admin configures Iubenda from the Integrations page and enables it. The public site then renders the consent configuration and its scripts in the document head, before GTM. When the integration is missing, disabled, or incomplete, nothing is emitted and the public site keeps working. Every change reaches the public site on the next request through on-demand revalidation.

**Blocked by:** 01 (Integration provider descriptor)

**Status:** done

- [x] The Iubenda form validates `siteId`, `cookiePolicyId`, `lang`, and `autoblocking` (default on), with no credential or connection-test fields.
- [x] The provider card reports "Configured" or "Not configured" and never mentions API keys.
- [x] Enabling is blocked until the configuration is complete, both in the UI and server-side.
- [x] With a complete, enabled configuration the public root layout emits, in order in the head, the inline CMP configuration, the loader selected by the autoblocking flag, and the asynchronous runtime script.
- [x] With a missing, disabled, or incomplete configuration nothing is emitted and the public page still returns normally.
- [x] Reading the public configuration never throws for those states.
- [x] Any integration mutation revalidates the public root layout.
- [x] Create, update, enable, and disable produce an audit entry, and no secret material appears in it.
- [x] The CMP renders in development, preview, and production whenever the integration is enabled.

## Notes

Iubenda is described by a descriptor with `siteId`, `cookiePolicyId`, `lang` (`it`/`en`), `autoblocking` (default on) and `consentMode` (default on). It has no secrets and no connection test.

Public rendering uses a fail-open `resolveIntegrationPublicConfig` (missing, disabled, incomplete or read error → `null`, never a throw) memoized per request. The root layout renders the resolved config in `<head>`; the CMP component emits the inline `_iub.csConfiguration` block, the autoblocking or sync loader, and the asynchronous `iubenda_cs.js` runtime, in that order. It is not gated on `NODE_ENV`.

Every integration mutation calls `revalidateContent("settings")`, so the root layout is fresh on the next request. No database migration is required.

Ticket 03 still owns removing the hand-written consent defaults and the explicit CMP-before-GTM rendering assertion; the current implementation already writes `googleConsentMode` from the `consentMode` flag.
