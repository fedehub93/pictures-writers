# Google Tag Manager as an Integration

**Status:** `ready-for-agent`

## Problem Statement

Google Tag Manager is the last external provider configured through the environment instead of the Integrations surface. `NEXT_GTAG_CONTAINER_ID` is read in exactly one place — the public root layout — and only when `NODE_ENV === "production"`. As a result:

- The value belongs to one Installation but lives in the deployment environment, contradicting ADR 0036: two Installations built from the same image cannot emit different containers, and changing the id requires a rebuild because the value is consumed by a prerendered server component.
- It is invisible where every other external provider is managed. Resend and Iubenda are Integrations; GTM is a variable nobody can see, audit, or edit from the backoffice.
- It is unvalidated. Any string is accepted by the renderer; a typo loads nothing and the only feedback is an empty Tag Assistant session.
- The `NODE_ENV === "production"` gate makes "enabled" invisible outside production, so the CMP → GTM ordering that ADR 0031 declares contractual cannot be verified in preview before going live.
- `NEXT_GA_TRACKING_ID` is documented but has no consumer anywhere in the code. GA4 is configured as a tag inside the GTM container, outside the CMS, so the variable implies a configuration path that does not exist.

## Solution

Make GTM a first-class provider inside the Integrations module, using the descriptor mechanism already proven by Iubenda.

An admin opens Integrations, enters the container id, and enables GTM. The public site emits the container in the document head, after the CMP block. When the integration is absent, disabled, or incomplete, nothing is emitted and the public site keeps working. Both GTM-related environment variables are removed, with no runtime fallback: the Integrations row is the only source.

The generic contracts do not change. `IntegrationProviderDescriptor` already models a provider with non-secret configuration, no secrets, no connection test, and public-site impact. This work adds one descriptor, one form, two map entries, and the already-declared-but-unread `affectsPublicSite` behaviour.

## User Stories

1. As an admin, I want to see Google Tag Manager listed among the site's integrations, so that I know which provider loads the tag container.
2. As an admin, I want to enter the container id in a dedicated form, so that I don't have to hand-write a snippet or ask for a deploy.
3. As an admin, I want the form to reject a malformed container id, so that a typo cannot silently remove analytics from the site.
4. As an admin, I want to be prevented from enabling GTM without a valid container id, so that "enabled" always means "emitting".
5. As an admin, I want to disable GTM in one click, so that I can stop the container without a deploy.
6. As an admin with read-only integration access, I want to see the GTM configuration and status without being able to change them, so that permissions stay meaningful.
7. As an admin, I want every GTM configuration change to be audited, so that I can see who changed the container and when.
8. As an admin, I want the provider card to report "Configured" or "Not configured" and not to mention credentials, so that I am not asked for secrets GTM does not have.
9. As an admin, I want a GTM change to reach the public site on the next request, so that I never wait for cache expiry or a redeploy.
10. As a visitor, I want the container to load after the consent block, so that no tag can fire before the CMP has established a consent state.
11. As a visitor, I want the public site to keep working when GTM is not configured, so that a missing integration never takes the site down.
12. As a visitor, I want consent decisions to keep flowing to the tags inside the container, so that the Iubenda template remains the only consent mechanism.
13. As a developer, I want GTM to be a descriptor plus a form, so that adding a provider still does not touch the generic integration CRUD.
14. As a developer, I want the container id resolved through the fail-open public-config read, so that a broken row degrades to "no GTM" instead of an error page.
15. As a developer, I want the enabled state to be the only gate, so that what the backoffice says and what the page emits cannot disagree.
16. As a developer, I want `affectsPublicSite` to actually drive revalidation, so that saving Resend stops invalidating the public layout while saving GTM keeps doing it.
17. As a developer, I want the head-rendering contract to stay untouched, so that ADR 0028's timing decision is not silently renegotiated.
18. As an operator, I want a documented cutover order, so that the public site never loses analytics without anyone noticing.
19. As an operator, I want the Integrations page to be the rollback surface, so that reverting is a toggle rather than a redeploy.
20. As an operator of a second Installation, I want the container to come from my database, so that the shared image can serve different sites.
21. As a future maintainer, I want the reasoning recorded in the existing ADRs, so that "why is GTM no longer an environment variable?" has an answer.

## Implementation Decisions

### 1. The `gtm` provider

- Provider key `gtm`, presentation name "Google Tag Manager", icon `TagIcon` from `lucide-react` wrapped in a provider icon component (parity with `iubenda-icon.tsx`).
- Non-secret configuration: `containerId` — required, `trim`med, uppercased, matching `^GTM-[A-Z0-9]{4,}$`. The validation message names the expected shape (`GTM-XXXXXXX`). A pasted snippet is rejected rather than parsed: extraction from arbitrary HTML can silently select the wrong identifier.
- No secrets (`secretFields: []`, no `secretsSchema`). `secretEncrypted` therefore stores the encrypted empty object, exactly as Iubenda does. `resolveIntegrationSecrets("gtm")` keeps throwing `no_secrets`, and nothing calls it.
- No connection test. The container id is a public identifier: an HTTP check would prove that `googletagmanager.com` responds, not that the container exists, is published, or is the intended one. Real verification is Tag Assistant against the public site.
- `affectsPublicSite: true`; `isReady` = the config schema parses, so enabling without a valid id is blocked server-side as well as in the form.

### 2. Registration is the only wiring

Adding the provider means entries in the exhaustive maps that already exist:

- `INTEGRATION_PROVIDERS` in `src/modules/integrations/lib/constants.ts`;
- `INTEGRATION_DESCRIPTORS` (`lib/providers/index.ts`) and `SERVER_DESCRIPTORS` (`server/descriptors.ts`, no connection test);
- `IntegrationSecretsByProvider` (`gtm: Record<string, never>`) and `IntegrationPublicConfigByProvider` (`gtm: GtmConfig`) in `lib/types.ts`;
- a setup guide in `lib/provider-guides.ts` (a test enforces parity with `INTEGRATION_PROVIDERS`).

No Prisma migration: `Integration.provider` is a plain unique `String`, and the row is created by the first save, as for Iubenda.

### 3. Public rendering

The public root layout resolves the container id next to Iubenda, inside the same `before`-request cache:

```tsx
const [settings, iubendaConfig, gtmConfig] = await Promise.all([
  getSettings(),
  withIntegrationResolutionCache(() =>
    resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_IUBENDA),
  ),
  withIntegrationResolutionCache(() =>
    resolveIntegrationPublicConfig(INTEGRATION_PROVIDER_GTM),
  ),
]);

<PublicHeadScripts
  iubendaConfig={iubendaConfig}
  gtmId={gtmConfig?.containerId}
/>
```

`PublicHeadScripts` keeps its current prop and its current output: the CMP block first, then `GoogleTagManager` from `@next/third-parties/google` with the `afterInteractive` strategy. ADR 0028's timing decision and ADR 0031's ordering contract are unchanged; only the source of the id changes.

The read is fail-open: missing, disabled, incomplete, or unreadable configuration yields `null`, so the page renders without GTM and no exception escapes.

### 4. Enabled state is the only gate

The `NODE_ENV === "production"` condition is removed. An enabled, complete integration renders in development, preview, and production; a disabled one renders nowhere. This makes "enabled" honest and makes the ordering contract verifiable in preview. Installations that do not want container traffic in a non-production environment leave the integration disabled — which is now a visible, audited decision instead of an implicit environment check.

### 5. `affectsPublicSite` gets its reader

`revalidatePublicIntegrations()` is called only when the descriptor declares `affectsPublicSite`. It keeps using the existing `settings` scope (`revalidatePath("/", "layout")` plus sitemap), so no new revalidation vocabulary is introduced.

Consequences: saving or toggling GTM revalidates the public root layout (a change is live on the next request); saving or toggling Resend no longer does; the connection test no longer revalidates, because `lastTestedAt` / `lastTestStatus` are never rendered publicly.

### 6. Cutover is manual, ordered, and has no fallback

There is no environment fallback and no backfill script. The operator:

1. deploys this change with the GTM integration disabled — the rollback point;
2. opens Integrations, enters the container id that lived in `NEXT_GTAG_CONTAINER_ID`, and enables it;
3. verifies in production that the container loads after the CMP block and that consent defaults are denied before a choice (Tag Assistant);
4. removes `NEXT_GTAG_CONTAINER_ID` and `NEXT_GA_TRACKING_ID` from the deployment environment.

Between steps 1 and 2 the public site emits no GTM. That window is deliberately short and controlled by the operator, and it is the price of not keeping a second source of truth for one release.

### 7. Environment and documentation

Both variables leave the code and the documentation. That includes the build-time prerender warning that exists only because a per-Installation value was read from the environment, plus the deployment and Dockerfile references.

No new ADR: this is an application of ADR 0036 (per-Installation values at runtime) and ADR 0031 (a provider without secrets described by a descriptor). ADR 0028 and ADR 0031 are amended where they state that GTM renders "in production" or comes from the environment.

### 8. No change to the event surface

`sendGTMEvent` call sites and `PageViewTracker` are untouched. They already queue into `dataLayer` before the container loads, so they keep working when the integration is configured and harmlessly queue when it is not.

## Testing Decisions

Tests assert observable behaviour: what the public document contains, what a public-config read returns for each state of the row, what the router persists and rejects, and whether a mutation invalidates the public layout. They do not assert descriptor internals.

Seams, highest first:

1. **Container id schema.** Accepts `GTM-ABC1234`, normalises surrounding whitespace and casing; rejects empty strings, `GT-XXXX`, `ABC1234`, and a pasted snippet.
2. **Public configuration read.** Returns `{ containerId }` for an enabled, complete row; `null` for missing, disabled, and invalid config, never throwing. Prior art: `lib/__tests__/public-config.test.ts`.
3. **Public head rendering.** The existing contract test keeps passing unchanged (CMP before GTM, `afterInteractive`). The container id reaches `_next-gtm`'s `src` when provided and nothing is emitted when it is `null`.
4. **Integrations router.** The list returns three providers; a valid id persists; a malformed id is rejected; enabling with no id throws; the audit payload contains configuration and no secrets.
5. **Revalidation gating.** Update and enable/disable revalidate for GTM and Iubenda and no longer for Resend; the connection test no longer revalidates. Prior art: the `public revalidation` block in `server/__tests__/integrations-router.test.ts`.

Existing assertions that hard-code two providers (`toHaveLength(2)`) must become three.

Automated tests cannot prove that a container is live. A manual smoke is mandatory: enable in production, confirm in Tag Assistant that the container loads after the CMP block, that consent is denied before a choice, and that GA4 page views resume.

## Out of Scope

- GA4 measurement id, Measurement Protocol, and offline purchase attribution. If that parked feature revives, the measurement id and its API secret belong to a `ga4` provider, not to `gtm` and not to an environment variable.
- A GTM container in the admin backoffice; it was removed and stays removed.
- A connection test for GTM.
- Extracting an id from a pasted GTM snippet.
- Migrating or inspecting `settings.scripts`; the escape hatch stays provider-agnostic, and the script list is empty on the current Installation.
- reCAPTCHA, Stripe, and UploadThing — separate providers from the same provisioning ticket.
- Server-side GTM and custom container domains.
- Any change to consent handling, the Iubenda integration, or the Iubenda GTM template.

## Further Notes

- The Iubenda template stays the single consent mechanism: it sets the denied defaults on Consent Initialization and applies the CMP's updates. GTM integration ownership does not change that.
- `dataLayer` keeps its default name; no per-Installation customisation is introduced.
- This is the second provider without credentials. It should be a descriptor and a form, and it is: the generic CRUD, schema, list projection, and admin surface are untouched.
- The cutover removes the last per-Installation analytics value read from the environment, which is one of the three values ADR 0036 lists as blocking a single shared image.
