# Provisioning: runtime contract spec

Status: needs-triage

**Paused.** The block is too large to land in one pass. It will be re-launched as several smaller specs; the extraction plan is at the end of this file. Everything below stays as the reference for what the whole thing requires, so the pieces that get built separately still fit together.

## Problem Statement

Spindle CMS (working name; this repository) becomes a product shipped as one Docker image to many Installations. Each Installation is provisioned automatically from a separate Control plane: its own PostgreSQL database and role, its own container, its own subdomain, its own first backoffice user. The owner pays, receives a URL, logs in and configures everything from the backoffice — no terminal, no environment variables, no manual step.

Today that is impossible for three reasons found in the code:

1. `next build` calls Prisma (`generateMetadata` in `src/app/(home)/layout.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, and `generateStaticParams` in five routes), so the build needs one specific database and bakes its content into the artifact.
2. Per-site values are inlined at build time (`NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`) or read from the environment at render time (`NEXT_GTAG_CONTAINER_ID`), so one image cannot serve two sites.
3. The brand of the first site is hardcoded in the app: UploadThing origin, host suffixes, contact email, redirects, sitemap paths, `robots` disallow list, `llms.txt` copy, JSON-LD founder, `lang` and `locale`, and 23 files in `public/`.

This spec covers **only the changes in this repository**. The provisioning service, its registry, and its calls to the Coolify API live in the separate Control plane repository.

## Decisions already taken

- One Installation per Tenant. One application container, one database, one domain. Nothing shared except the image.
- One PostgreSQL cluster (Coolify) hosting N logical databases, one role per database with rights on its own database only.
- One image per release, built in CI, no database required. See ADR-0036.
- Subdomain first: `<slug>.spindlecms.com` with a wildcard certificate. Custom domains are a later upgrade.
- Media: default driver is the Host's local filesystem with a per-Installation quota; UploadThing remains available and stays in use for the first Installation. Canonical media URL is `<siteUrl>/media/<key>` regardless of driver, so switching driver never rewrites stored URLs.
- Everything per-Installation is configured from the backoffice: Stripe, reCAPTCHA, GTM, analytics, email providers all become Integrations or Installation settings.
- Redirects from the database are deferred. The two brand redirects currently in `next.config.mjs` are removed now and configured at the proxy for the first Installation.
- Public sign-up is disabled; users enter by invitation or through Bootstrap.
- Locale is one field per Installation now; URL-prefixed locales are a separate feature.
- No billing, quotas enforcement beyond media, suspension or self-service in this block.

## Solution

Seven changes, all backwards compatible with the single Installation running in production today. They are listed below by importance; the order in which they should reach `main` is different, because the two that touch live behaviour should land after the image and the media route are proven:

`07` (cleanup) → `02` (media) → `03` (image) → `04` (rendering) → `01` (runtime config) → `05` (brand) → `06` (bootstrap)

Two hard rules: **seed before delete** (the settings and Integrations must contain the value before the constant is removed), and **never merge a deletion and its replacement in the same deploy**.

An eighth ticket (`08`, UploadThing as a selectable Integration) is written but deliberately outside this block: it depends on `02` and it is not needed to ship the first two Installations.

The acceptance criterion for the whole block is: **two copies of the same image, pointed at two different databases, on two different domains, behave as two unrelated CMSes — without rebuilding anything.**

### 1. Runtime configuration instead of build-time environment

Read every per-Installation value on the server from Installation settings or an Integration, and pass what the browser needs as props or a server-rendered payload.

- `NEXT_PUBLIC_APP_URL` disappears. Server code uses `Settings.siteUrl`; browser code uses relative URLs (`/api/trpc`, same-origin auth client). Files: `src/trpc/client.tsx`, `src/lib/auth-client.ts`, `src/app/api/checkout/**`, `src/modules/users/server/emails.ts`, `src/modules/mails/**`.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` are read from their Integration at render time and injected into the page. The GTM container id no longer exists as a variable at all: it is `Integration.config.containerId` for the `gtm` provider (done in `.scratch/gtm-integration/`).
- Changing any of them revalidates the affected routes.

Done when: no `NEXT_PUBLIC_*` value is per-Installation, and `grep -r NEXT_PUBLIC_ src/` returns nothing that varies per site.

### 2. Media URL stability and a local driver that works

- `mediaUrl(key)` is the only function composing a media URL; `Media.key` is the source of truth, `Media.url` is derived.
- `storageKeyFromMediaUrl` (`src/modules/media/lib/url.ts`) recognises `/media/<key>` in addition to the legacy `/assets/` and `ufs.sh` shapes.
- `isPicturesWritersUrl` becomes a host-agnostic check driven by `Settings.siteUrl` and the configured storage origins.
- A route handler serves `/media/<key>`: streams from disk for the local driver, `302` with `Cache-Control: immutable` to the provider for remote drivers.
- Storage keys are namespaced per Installation.
- Quota (`Settings.mediaQuotaBytes`, default 5 GB) is checked before an upload and counted as original plus renditions.

Done when: the local driver stores and serves an image on a fresh Installation, and no stored URL contains a domain.

### 3. A real deployment artifact

- `output: "standalone"` in `next.config.mjs`.
- A `Dockerfile` (the draft in `docs/self-hosting/appendice-b-dockerfile.md` is the starting point) that ships the Prisma CLI and migrations, because `scripts/start-production.sh` runs `prisma migrate deploy` at start.
- Image tagged by commit, published to a registry.

Done when: the image starts against an empty database, migrates it, and serves the health endpoint.

### 4. Rendering without build-time data

- `generateStaticParams` returns nothing (or is removed) where it only pre-warmed published slugs: `[...slug]`, `blog/[slug]`, `shop/[categorySlug]/[productSlug]`, `shop/.../submission`, `draft/[...slug]`.
- `dynamicParams = true` and `revalidate = 86400` stay.
- The public layout renders without `headers()` or `cookies()`.
- Warmup is a Control plane concern: after health, it GETs home, blog, shop, sitemap, robots and `llms.txt`.

Done when: the build succeeds with no database reachable.

### 5. Brand out of the code

Remove from the app: `UPLOADTHING_FILE_ORIGIN`, `PICTURES_WRITERS_HOST_SUFFIXES`, `CONTACT_EMAIL`, the `/ebooks/*` and `/concorso-tre-colori-2025/` redirects, the static sitemap paths, the brand `llms.txt` copy and the JSON-LD founder/address, `lang="it"` and `locale: "it_IT"`. Replace the `"Pictures Writers"` defaults in `src/data/settings.ts` with neutral ones. Move the 23 brand files out of `public/`.

`llms.txt` and `llms-full.txt` are generated from Installation settings (site name, description, published pages) plus an optional `Settings.llmsExtra` markdown field.

Done when: `grep -ri pictureswriters src/ prisma/ public/ next.config.mjs` returns nothing, and CI fails if it does.

### 6. Bootstrap and access control

- `POST /api/bootstrap/` guarded by `BOOTSTRAP_SECRET`: creates the first backoffice user through Better Auth's own API (`auth.api.signUpEmail`), assigns the admin role, writes `Settings.siteUrl`, spends the secret.
- `disableSignUp: true` in both auth configurations (`src/shared/lib/auth.ts`, `src/lib/auth.ts`), which must stay in sync.
- `Settings.siteUrl` is read-only in the backoffice, with a note that the domain is managed by the hosting panel.

Done when: a fresh image plus an empty database yields a working admin login with no SQL and no terminal.

### 7. Naming

The repository becomes Spindle CMS: package name, README, AGENTS.md, image name, test database name, and the `package.json` name. `bcryptjs` is an unused dependency and is removed. `.vercel/` is removed. `Settings.deployWebhookUrl` is dead and is removed.

## Non-goals

- Control plane, registry, Coolify API calls, billing, suspension, deletion.
- Redirects stored in the database.
- URL-prefixed locales.
- R2/S3 driver.
- UploadThing as a selectable Integration (ticket 08).
- Migrating the first Installation's existing UploadThing media.
- `Language` semantics for content.

## Open questions

1. Does `Settings.siteUrl` stay writable by the Control plane only, or does a "change domain" flow belong in the product? Current answer: Control plane only, because `BETTER_AUTH_URL` and the Stripe webhook URL must change with it.
2. Does the first Installation become a Tenant of the Fleet (recommended, it validates the pipeline on a real site) or stay outside it?

## Extraction plan

The block is paused and will be rebuilt from smaller specs. What follows is what to extract, in what order, and what cannot be extracted.

### Cheap, independent, worth doing now

1. **`07` Rename and cleanup.** No runtime impact, no dependency.
2. **`02` Media URLs and the local driver.** Additive. Also the only piece that must precede `05` and `08`.
3. **The integrations, one at a time, in increasing risk: GTM → reCAPTCHA → Stripe.** GTM has no secrets and touches no money; Stripe is last because a mistake there stops sales. The **first** integration carries the shared plumbing: the `affectsPublicSite` revalidation reader, which today is a flag nobody reads. The other two then copy it. Doing GTM first means the second integration is a descriptor and a form, nothing more.
4. **The canonical URL** (`NEXT_PUBLIC_APP_URL` → `Settings.siteUrl` on the server, relative URLs in the browser). Global, but separable from the providers and small enough to own a spec.

### The residue that must stay together

- **`03` image + the Control plane.** The image is only worth building when something deploys it; this pair is the irreducible core.
- **`06` bootstrap.** Only meaningful as the first step of a provisioned Installation, and it needs `03` to be tested.
- **`04` rendering without build-time data.** Safe on its own, but it only pays off once the build is per release, i.e. with `03`.
- **`05` brand out of code.** Depends on `01` and `02`: it comes after the integrations and the media.

### Two rules that survive the split

- **Per provider, seed before delete.** The value must be in the database before that provider's environment fallback is removed, and the public page verified on a staging copy. This is per provider, not per block — it is what makes the one-at-a-time approach safe.
- **Every extracted spec must keep the runtime contract.** No `NEXT_PUBLIC_*` for anything per Installation, no `headers()` in the public layout, browser URLs relative. If a spec violates one of these to save time, the later block gets more expensive, not less.
