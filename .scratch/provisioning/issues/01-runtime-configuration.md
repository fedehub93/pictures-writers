# 01 — Runtime configuration instead of build-time environment

Status: in progress — GTM done; reCAPTCHA and Stripe open
Blocked by: —

**Split:** this ticket bundles one global change (the canonical URL) with N per-provider changes. It should be delivered as one spec per provider — GTM first, then reCAPTCHA, then Stripe — plus one spec for the URL. See the extraction plan in `../spec.md`.

### Progress

| Piece | State | Where |
| --- | --- | --- |
| Google Tag Manager | **Done** — `gtm` provider (descriptor + form), public rendering from the Integration, `affectsPublicSite` revalidation, both GTM variables removed from code and docs | `.scratch/gtm-integration/`, cutover in `docs/integrations-runbook.md` |
| reCAPTCHA | Open | this ticket |
| Stripe | Open | this ticket |
| Canonical URL from `Settings.siteUrl` | Open | this ticket |

## Problem

`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` are inlined at build time; `NEXT_GTAG_CONTAINER_ID` is read from the environment during render. Two Installations built from one image cannot therefore differ. *(GTM part fixed: see Progress above.)*

## Where each value lives

Ticket 01 is *how* the value is read (at render, not at build). Your decision on *where* it lives gives the answer: in an Integration, because they are all external services.

| Value | Home | Why |
| --- | --- | --- |
| Stripe publishable key | Integration `stripe`, `config` | non-secret, needed by the browser |
| Stripe secret key, webhook secret | Integration `stripe`, `secrets` | write-only, server only |
| reCAPTCHA site key | Integration `recaptcha`, `config` | non-secret, rendered into the page |
| reCAPTCHA secret key | Integration `recaptcha`, `secrets` | server only |
| GTM container id | **Done** — Integration `gtm`, `config` | shipped in `.scratch/gtm-integration/`; no longer read from the environment |
| UploadThing token / R2 credentials | Integration, `secrets` | deferred to ticket 08; the environment stays the source for the first Installation |
| `siteUrl`, `siteName`, `timezone`, `locale`, `mediaQuotaBytes`, logo, JSON-LD | Installation settings | the Installation itself, not an external service |
| `DATABASE_URL`, `BETTER_AUTH_SECRET`, `SECRETS_ENCRYPTION_KEY`, `SCHEDULED_PUBLICATION_SECRET`, `BOOTSTRAP_SECRET` | environment, written by the Control plane | they make the Installation boot; `SECRETS_ENCRYPTION_KEY` cannot be stored inside the store it decrypts |

The machinery already exists: `IntegrationProviderDescriptor` (config schema, secret fields, `isReady`, `affectsPublicSite`) plus `resolveIntegrationPublicConfig`, which is already fail-open — a missing, disabled or incomplete Integration returns `null` instead of throwing, so a page keeps rendering when a provider is not configured.

Note: `affectsPublicSite` is declared but **nothing reads it** (only the descriptors and a test mention it). The step that revalidates the public routes when an Integration is saved has to be written here; it is the piece that makes "change the GTM id in the backoffice" take effect without a deploy. **Done for GTM:** `revalidatePublicIntegrations(descriptor)` now reads `affectsPublicSite` and runs only for providers that declare it (`ae470359`).

Two consequences to design for: with Stripe absent the shop must degrade (hide the buy action, explain why) rather than fail, and an Integration that is not configured must never block the public layout.

## What

### A. Three new Integration providers — required, not optional

Stripe, reCAPTCHA and Google Tag Manager are implemented as Integration providers, using the existing descriptor mechanism. Nothing in the generic integration CRUD changes; adding a provider is a descriptor plus a form.

- `src/modules/integrations/lib/constants.ts`: add `INTEGRATION_PROVIDER_STRIPE`, `INTEGRATION_PROVIDER_RECAPTCHA`, `INTEGRATION_PROVIDER_GTM` and list them in `INTEGRATION_PROVIDERS`.
- One descriptor per provider under `lib/providers/` (`stripe.ts`, `recaptcha.ts`, `gtm.ts`), each with its own config schema file following `iubenda-config.ts`, and each registered in `INTEGRATION_DESCRIPTORS` in `lib/providers/index.ts`.
- `configSchema`, `secretFields`, `isReady` and `affectsPublicSite: true` for all three. `INTEGRATION_DESCRIPTORS` is typed `satisfies Record<IntegrationProvider, IntegrationProviderDescriptor>`, so adding a provider to the constant list without a descriptor does not compile: the catalogue cannot drift.
- One admin form per provider under `ui/components/providers/`, following the Iubenda form.
- Secret fields: Stripe `secret key` and `webhook secret`; reCAPTCHA `secret key`. GTM declares none, exactly like Iubenda.

Because the CRUD, list and admin surface read the catalogue, the three providers appear in the backoffice as soon as they are registered. No screen has to be built by hand.

### B. Read them at render time

- Server: read the canonical URL from `Settings.siteUrl`.
- Browser: use relative URLs. `src/trpc/client.tsx` and `src/lib/auth-client.ts` stop reading `NEXT_PUBLIC_APP_URL`; tRPC calls `/api/trpc`, Better Auth uses the current origin.
- Stripe publishable key, reCAPTCHA site key and GTM container id are resolved through `resolveIntegrationPublicConfig` on the server and passed into the page (prop or server-rendered payload). Secrets are read through the existing server-only resolution, never sent to the client. **GTM done:** the public root layout resolves it next to Iubenda.
- Absolute URLs that must exist outside a page (Stripe return URLs, invite links, unsubscribe, free download) use `Settings.siteUrl`.
- Saving an Integration with `affectsPublicSite: true` revalidates the affected routes. This reader does not exist yet: `affectsPublicSite` is currently declared and never read. **Done** (see the note above).
- Transitional: keep reading the environment as a fallback when the database value is absent, for one release only. Remove the fallback in a follow-up, and delete the variable from the Control plane's table at the same time. **Not applied to GTM:** both GTM variables were removed from the code and the docs without a fallback; the cutover is ordered and documented in `docs/integrations-runbook.md`.

## Files

`src/trpc/client.tsx`, `src/lib/auth-client.ts`, `src/app/api/checkout/**`, `src/modules/users/server/emails.ts`, `src/modules/mails/**`, `src/shared/components/checkout/**`, `src/app/(home)/(routes)/shop/checkout/**`, `src/app/(home)/_components/utils/captcha.ts`, `src/app/(home)/layout.tsx`, `src/integrations/**`.

## Done when

- `grep -r "NEXT_PUBLIC_" src/` returns no per-Installation value.
- Stripe, reCAPTCHA and GTM appear in the Integrations backoffice on a fresh Installation, each with its own form, and can be enabled, edited and disabled. **GTM done; reCAPTCHA and Stripe open.**
- Two databases, same image, different domains: each page emits its own URL, Stripe key and GTM id. **GTM id done; URL and Stripe key open.**
- Changing the GTM id in the backoffice takes effect on the public site without a deploy. **Done.**
- Checkout completes end to end on the second Installation with keys set only in the backoffice.

## Production impact

**Can break the shop.** Before deploying, seed the Stripe and reCAPTCHA values into the running database and verify checkout on a staging copy. The env fallback exists only for this reason. GTM is already migrated: its cutover is ordered and documented in `docs/integrations-runbook.md` ("Cutting Google Tag Manager over from the environment") and has no environment fallback.
