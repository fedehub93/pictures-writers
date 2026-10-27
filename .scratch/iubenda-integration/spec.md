# Iubenda as an Integration

**Status:** `ready-for-agent`

## Problem Statement

Iubenda — the site's consent management provider — is configured today as arbitrary script entries in the site settings, while the generic public-script component carries provider-specific rules for it: load strategies are forced by matching Iubenda URLs. As a result:

- The consent configuration is invisible in the Integrations surface, where every other external provider is managed.
- The values are unvalidated free text, so a typo in the site id silently produces a broken or absent banner.
- The same provider can be configured twice (settings entries plus anything added later), and the generic script mechanism is not actually generic.
- The document order is not guaranteed: GTM sits in the head while the CMP scripts sit at the end of the body, so Google tags can fire before consent is established.
- A hand-written `gtag('consent', 'default', …)` block competes with the CMP's own Consent Mode handling, which Iubenda documents as something to remove.

## Solution

Make Iubenda a first-class provider inside the Integrations module and generalize `Integration` so a provider may have non-secret configuration and no secrets at all.

An admin opens Integrations, enters the Iubenda identifiers, validates and enables the provider. The public site then renders the CMP configuration and its scripts in the document head, before GTM. Iubenda owns Google Consent Mode while it is enabled; the hand-written consent defaults are removed. When the integration is absent, disabled, or incomplete, nothing is emitted and the public site keeps working.

The generic custom-scripts list remains as an escape hatch for one-off snippets, but it loses every Iubenda-specific rule.

## User Stories

1. As an admin, I want to see Iubenda listed among the site's integrations, so that I know which external provider handles consent.
2. As an admin, I want to enter the Iubenda site id and cookie policy id in a dedicated form, so that I don't have to hand-write script tags.
3. As an admin, I want the form to validate required identifiers, so that a typo cannot silently disable the banner.
4. As an admin, I want to choose the site language for the banner, so that it matches the public site.
5. As an admin, I want to choose whether autoblocking or sync is used, so that the emitted loader matches what my Iubenda dashboard expects.
6. As an admin, I want to declare whether Iubenda should manage Google Consent Mode, so that GTM receives the consent signals Iubenda already knows about.
7. As an admin, I want the provider card to say "Configured" or "Not configured" instead of talking about API keys, so that I can tell at a glance whether it is ready.
8. As an admin, I want to enable Iubenda only when its configuration is complete, so that I cannot publish a broken banner.
9. As an admin, I want to disable Iubenda in one click, so that I can take the CMP off the public site without a deploy.
10. As an admin, I want to see that Iubenda has no credentials or connection test, so that I am not asked for secrets it does not have.
11. As an admin with read-only integration access, I want to see the Iubenda configuration and status without being able to change them, so that permissions stay meaningful.
12. As an admin, I want every Iubenda configuration change to be audited, so that I can see who changed the consent setup and when.
13. As an admin, I want a change to the Iubenda integration to reach the public site immediately, so that enabling or disabling it does not wait for cache expiry.
14. As an admin, I want Resend to keep working exactly as before, so that generalizing integrations does not regress email.
15. As a visitor, I want the consent banner to appear in the document head before GTM, so that no analytics or advertising tag runs before I choose.
16. As a visitor, I want the banner to reflect my choices on every page, so that consent is consistent across navigation.
17. As a visitor, I want the public site to keep working when the CMP is not configured, so that a missing integration never takes the site down.
18. As a developer, I want the public read of a provider's configuration to return nothing instead of throwing, so that public rendering can degrade gracefully.
19. As a developer, I want the credential resolver to keep throwing, so that a missing API key still fails loudly (ADR 0023).
20. As a developer, I want one descriptor per provider to own its config schema, optional secrets schema, form, enable rule, and connection test, so that adding a provider does not touch the generic integration CRUD.
21. As a developer, I want the Iubenda rendering to be a single component driven by resolved config, so that the document order can be asserted in one test.
22. As a developer, I want the CMP block to be a raw inline script rather than `next/script`, so that its position relative to GTM is deterministic instead of conventional.
23. As a developer, I want the integration mutation path to revalidate the public root layout, so that "enabled" is true on the next request.
24. As a developer, I want custom scripts to have no provider-specific branching, so that the generic mechanism stays generic.
25. As a developer, I want `beforeInteractive` gone from the custom-script choices, so that the admin cannot select a strategy the renderer silently downgrades.
26. As a developer, I want stored `beforeInteractive` values to behave as `afterInteractive`, so that existing rows do not change behaviour or break rendering.
27. As a developer, I want Iubenda to render in development and preview when enabled, so that I can verify the banner and the consent order before production.
28. As a security reviewer, I want Iubenda secrets to be irrelevant and its identifiers treated as public configuration, so that no secret is exposed through a public read.
29. As a security reviewer, I want the audit payload to contain configuration but never credentials, so that the activity log stays safe.
30. As an operator, I want a documented cutover order, so that Iubenda never loads twice during the migration.
31. As an operator, I want the deploy with the integration disabled to be the rollback point, so that reverting needs one click, not a redeploy.
32. As a future maintainer, I want the reasoning recorded in an ADR, so that "why is a CMP in Integrations?" has an answer.
33. As a future maintainer, I want the glossary to describe `Integration` as having optional secrets, so that the model matches the code.
34. As a future maintainer, I want ADR 0028's third-party-scripts section corrected, so that it no longer claims Iubenda is untouched by performance work.

## Implementation Decisions

### 1. Integration becomes a provider descriptor

Each provider is described in code by a descriptor that owns:

- its provider key and presentation (name, description, icon);
- a schema for non-secret configuration;
- an optional schema for secrets;
- a disable/enable rule (what "ready" means for that provider);
- an optional connection test;
- a flag for whether it affects the public site;
- a provider-specific admin form component.

`Integration.config` (already a JSON column) holds non-secret provider settings; no schema migration is required. Secrets remain encrypted and write-only.

Admin reads return the provider key, enabled state, non-secret configuration, a provider-agnostic summary of which secrets are present, and test metadata. They never return secret values, and they no longer expose Resend-specific `hasApiKey` / `hasWebhookSecret` fields.

The enable rule is enforced server-side, not only in the UI. The connection test is offered only by providers that declare one. Adding a provider is a descriptor plus a form; the generic CRUD, schema, and list projection stay untouched.

### 2. Two read contracts, with different failure semantics

- **Credentials.** The existing server-only resolver for secrets keeps its current semantics: missing row, disabled row, incomplete secrets, and undecryptable ciphertext all throw explicit errors. ADR 0023 is unchanged.
- **Public configuration.** A new server-only read returns the provider's non-secret configuration or `null`. It never throws: missing row, disabled row, and incomplete configuration all produce `null`, with one structured log line per request. It is memoized per request like the credential resolver.

Fail-open exists only for public rendering. It is an explicit exception, recorded in the new ADR.

### 3. The Iubenda provider

Non-secret configuration:

- `siteId` — required;
- `cookiePolicyId` — required;
- `lang` — required, at least `it` and `en`;
- `autoblocking` — boolean, default `true`; `true` selects the autoblocking loader, `false` selects the sync loader;
- `consentMode` — boolean, default `true`; when true, the CMP configuration declares Google Consent Mode.

Iubenda has no secrets and no connection test. It declares that it affects the public site.

When present, enabled, and complete, the public root layout emits, in `<head>` and in this order:

1. the inline `_iub.csConfiguration` block;
2. the loader for the chosen mode (`autoblocking` or `sync`);
3. the CMP runtime script, asynchronous.

The injection is a raw inline script, not `next/script`, so the order relative to GTM is guaranteed by the document rather than by framework conventions.

When the integration is missing, disabled, or incomplete, the component renders nothing and the page still renders normally.

Every mutation of the integration revalidates the public root layout through the existing settings scope.

Rendering is driven by the integration's enabled state in every environment — development, preview, and production. It is not gated on the Node environment.

### 4. Consent Mode ownership

While Iubenda is enabled and its `consentMode` flag is on, Iubenda owns both default consent and consent updates.

The hand-written consent-default component is deleted. No replacement is emitted when Iubenda is absent or disabled: GTM keeps its default behaviour and the operator is responsible for the configuration. This is an accepted consequence, not a fallback.

GTM remains `afterInteractive` and is rendered after the CMP block. Page view tracking is unaffected because the GTM helper creates its own data layer queue.

### 5. Ordering is a tested contract

The CMP block precedes GTM in the rendered head, and the runtime script is asynchronous. This is asserted by a rendering test rather than left to convention or comments.

### 6. The generic custom-scripts list

`settings.scripts` remains available for one-off third-party snippets and continues to render from the public root layout in production.

It loses all Iubenda-specific behaviour: no URL matching, no forced strategies, no exceptions.

`beforeInteractive` is removed from the admin's strategy choices. The stored type may remain for compatibility, but persisted `beforeInteractive` values are treated as `afterInteractive`, preserving current safety behaviour without lying in the UI.

### 7. Cutover is manual and ordered

There is no automatic parsing of existing script entries. The operator:

1. removes the old Iubenda entries from the custom-scripts list;
2. deploys the feature with the Iubenda integration disabled;
3. enters the identifiers and enables the provider;
4. verifies the banner and the consent order in preview;
5. enables in production.

Step 2 is the rollback point: disabling the integration removes the CMP without a deploy.

### 8. Permissions and audit

No new permissions. Iubenda uses `integrations.read` and `integrations.manage`.

Create, update, enable, and disable continue to produce administrative activity entries. Configuration is non-secret and may appear in the audit payload; secret material never does.

### 9. Documentation

- A new ADR records: Integration admits providers without secrets; public configuration reads fail open; the CMP owns Consent Mode; ordering is contractual.
- ADR 0028 is amended because its third-party-scripts section states that Iubenda and the script model are untouched.
- `CONTEXT.md` updates the `Integration` definition so secrets are optional, and adds consent management to the examples of `Provider`.

## Testing Decisions

A good test asserts externally observable behaviour: what the public document contains and in which order, what a server read returns for each integration state, what the router persists and rejects, and which values the client never receives. Tests do not assert internal helper shapes, query counts, or the descriptor's private structure.

Seams, highest first:

1. **Public CMP rendering.** Given resolved configuration and enabled state, the component emits the configuration block, the chosen loader, and the runtime script in that order; with `null` it emits nothing. Prior art: the existing public-scripts component test.
2. **Public configuration read.** `null` for missing, disabled, and incomplete; configuration for a complete enabled row; no exceptions. Prior art: the integration resolution tests.
3. **Integrations router.** Iubenda configuration persists; enable is rejected when the configuration is incomplete; reads never return secrets; audit entries contain no secrets. Prior art: the integrations router tests.
4. **Generic scripts.** No Iubenda-specific branching remains; `beforeInteractive` degrades to `afterInteractive`; other strategies pass through. Prior art: the existing scripts test.

The Resend contract must remain green without changes to its tests.

Automated tests cannot prove that Iubenda actually works. A manual smoke in preview is mandatory: the banner appears, the choices persist across navigation, and GTM does not send analytics or advertising events before consent.

## Out of Scope

- TCF and GPP scripts, and per-purpose consent configuration.
- The unified Iubenda widget embed (`embeds.iubenda.com/widgets/...`).
- Privacy policy links and widgets.
- Embedding Iubenda through the GTM community template instead of the document head.
- GTM, Stripe, UploadThing, reCAPTCHA, or any provider other than Iubenda.
- Automatic parsing or migration of the existing script rows.
- Secret rotation and re-encryption.
- Multi-tenant installations.
- A reveal endpoint for secrets.
- Consent analytics, reporting, or dashboards.
- Removing the custom-scripts page.

## Further Notes

- The provider-secrets decision is ADR 0023; the ordering change supersedes part of ADR 0028; the bundle budget in ADR 0029 is the place to check the performance impact of one extra early third-party connection.
- Iubenda documents that manual `gtag('consent', 'default', …)` code must be removed when its Consent Mode is active, and that its scripts must precede Google scripts.
- This feature is the first proof that the Integration descriptor works for a provider without credentials; the next providers are expected to be additions of a descriptor and a form, not changes to the generic CRUD.
