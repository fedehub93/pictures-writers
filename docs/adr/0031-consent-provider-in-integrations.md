# Consent provider lives in Integrations; public configuration fails open

Iubenda used to be configured as arbitrary rows in `settings.scripts`, and `AppScripts` carried Iubenda-specific rules: it matched Iubenda URLs and forced their load strategies. That arrangement hid the consent setup from the Integrations surface, accepted unvalidated free text for the site and cookie-policy identifiers, allowed the provider to be configured twice, and left document order to convention — GTM was in the head while the CMP scripts sat at the end of the body. A hand-written `gtag('consent', 'default', …)` block also competed with Iubenda's own Consent Mode handling, which Iubenda documents as something to remove.

We generalized `Integration` so a provider does not have to be a credential pair plus a webhook secret. Each provider is now a code descriptor that owns its presentation, a schema for non-secret configuration, an optional schema for secrets, its enable rule, an optional connection test, whether it affects the public site, and its admin form. `Integration.config` is the existing JSON column, so this needed no schema migration. Secrets remain encrypted and write-only; secret values are never returned by any read path.

We then moved the consent provider into Integrations. Iubenda declares no secret fields, and its identifiers are public configuration.

## Two read contracts, opposite failure semantics

- **Credentials** keep the fail-loud contract of ADR 0023. The server-only resolver throws explicit errors for a missing row, a disabled row, incomplete secrets, and undecryptable ciphertext.
- **Public configuration** is fail-open. A server-only read returns the provider's non-secret configuration or `null`, and never throws: missing, disabled, incomplete, and unexpected read errors all produce `null`. A missing or disabled integration is the normal state of an optional provider and stays silent; an incomplete configuration or an unexpected read error logs one structured `public_config_unavailable` line per request, because those need attention.

Both reads use the per-request cache when the caller wraps the work in `withIntegrationResolutionCache`.

Fail-open exists only for public rendering, where a missing third-party provider must not take the page down. Credential consumers stay fail-loud because a silently absent key turns into lost mail or unauthenticated requests rather than a degraded public page.

## The CMP owns Consent Mode through the GTM template

While Iubenda is enabled with its consent-mode option, Iubenda owns the consent decisions. The CMP emits `googleConsentMode: "template"`, which delegates both default consent and consent updates to the Iubenda GTM template. The template runs on Consent Initialization, before any other GTM tag, sets every purpose to denied, and applies the updates the CMP pushes to `_iub.gtmDataLayer` and `_iub.gtmDataLayerV2`. The template must stay active while the integration is enabled.

With the GTM template paused, the direct `googleConsentMode: true` mode emitted consent updates but did not establish a denied default: the first GA4 request went out with `_ga` cookies and no denied `gcs` signal. The template is what provides the default. We chose `"template"` because it is Iubenda's documented manual-embedding mode: the template owns both the denied defaults and the updates, and it also emits `iubenda_gtm_consent_event` for custom tags. We kept the hand-written consent-default component deleted: the GTM template is now the single default-deny mechanism.

When Iubenda is absent or disabled, the site emits no CMP and no consent signals. If the GTM template is still active, however, it keeps defaulting consent to denied with no banner to update consent. Disabling the integration therefore also requires pausing the Iubenda template in GTM; that is an operational step, not something the site can enforce. GTM stays `afterInteractive`.

## Document order is a contract

When present, enabled, and complete, the public root layout emits in `<head>`, in this order:

1. the inline `_iub.csConfiguration` block;
2. the autoblocking or sync loader selected by configuration;
3. the asynchronous CMP runtime script.

When the GTM integration is enabled and complete, it comes after that block, in any environment. Inside GTM, the Iubenda template runs on Consent Initialization, so its denied defaults land before the GA4 configuration and `page_view` tags. The CMP block is raw inline markup rather than `next/script`, so the document itself determines the order instead of framework convention. A rendering test asserts the sequence and the runtime's `async` attribute; this is a tested contract, not a comment. The runtime also carries an `itemProp` so React 19 does not hoist the async script ahead of the configuration block.

`settings.scripts` remains an escape hatch for one-off snippets, but it no longer knows anything about Iubenda: no URL matching, no forced strategies. `beforeInteractive` is no longer offered in the admin and persisted values render as `afterInteractive`.

## Considered options

- **Consent provider as an Integration descriptor (chosen)**: one visible, validated, permissioned and audited home for the provider, with public rendering driven by the same row that admins edit.
- **Keep Iubenda in `settings.scripts` and refine the URL matching**: rejected because the generic script list stays provider-aware, the configuration stays unvalidated, and the document order stays conventional.
- **Auto-parse the old script rows into integration configuration**: rejected because the values are free text inside arbitrary snippets; the operator performs the cutover explicitly (see `docs/integrations-runbook.md`).
- **Render the CMP with `next/script`**: rejected because framework insertion and hoisting rules, not the document, would decide the order relative to GTM.
- **Make the public configuration read fail-loud**: rejected because a missing or broken third-party provider would take the public site down instead of removing one banner.
- **Rely on `googleConsentMode: true` with the template only for defaults**: rejected because it splits ownership (template defaults, CMP updates) and never emits `iubenda_gtm_consent_event`; with the template paused it also has no denied default.
- **Re-add the hand-written consent-default block**: rejected because the Iubenda GTM template already provides a guaranteed Consent Initialization default and also emits `iubenda_gtm_consent_event` for custom tags.
- **Give Iubenda stored secrets**: rejected because its identifiers are public configuration and there is nothing to authenticate against.
- **Environment fallback for credentials**: still rejected under ADR 0023.

## Consequences

- The Integrations page is the only configuration surface for Iubenda; enabling requires a complete configuration, enforced server-side.
- A missing or disabled integration emits nothing and stays silent; an incomplete configuration or a read error also emits nothing but logs a structured `public_config_unavailable` line. Either way the public site keeps rendering.
- The Iubenda GTM template must stay active while Consent Mode is enabled; it is the component that sets the denied defaults and applies the banner's updates.
- With Iubenda disabled the site emits no CMP; the operator must also pause the Iubenda template, otherwise it keeps consent denied with nothing to update it.
- Saving an integration or toggling its enabled state revalidates the public root layout, so changes reach the next request.
- A reintroduced ordering bug fails the head-rendering test.
- ADR 0028's third-party-scripts section is amended: Iubenda is no longer loaded by `AppScripts`.
- Adding another provider leaves the generic integration CRUD and schema untouched: it is a descriptor plus a form, and a provider that consumes credentials also adds its resolver entry.
