# Build one image and configure each Installation at runtime

**Status**: accepted

The codebase becomes a product: every customer runs its own Installation — its own container, database, database role, domain and settings — provisioned from a Control plane. Until now the artefact was implicitly per-site, because `next build` calls Prisma (`generateMetadata` in `(home)/layout.tsx`, `sitemap.ts`, `robots.ts`, and five `generateStaticParams`) and because `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` are inlined into the client bundle. A build therefore required one specific database to be reachable and produced HTML that belonged to one specific site.

We build **once per release**, in CI, with no database available, and let every per-Installation value arrive at runtime. Values live in Installation settings or in an Integration row and are read on the server at render time. The canonical URL is written once at Bootstrap and is the only source of absolute URLs; browser code uses relative URLs, so tRPC and Better Auth work on any domain without environment variables. Routes that used `generateStaticParams` to pre-warm known slugs now render on demand and are cached by the ISR that was already in place (`revalidate = 86400`, `dynamicParams = true`); after a deploy the Control plane warms the hot routes of each Installation so real visitors still get cached HTML.

The trade-off is that the first request for each page after a deploy pays a render instead of reading a file the build produced. Nothing else changes: unknown slugs already render on demand in production (`dynamicParams = true`), and every publish already invalidates its route through `revalidatePath`, so the render-on-first-hit path is in use today — this decision only makes it the only path. After a deploy the Control plane warms the hot routes, replacing what the build used to provide for the pages that matter, while making a release independent of every tenant database being reachable and healthy.

Consequences:

- No per-Installation value may be read through `NEXT_PUBLIC_*`; a value that must reach the browser is read on the server and passed down, and its route is revalidated when it changes.
- Rendering must stay free of `headers()` and `cookies()` in the public layout, otherwise every public page becomes dynamic and the ISR is lost.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is fleet-wide and must stay stable across releases, or Server Actions issued by a previous container stop working.
- The image must ship the Prisma CLI, because migrations run at container start (`scripts/start-production.sh`); with `output: "standalone"` and a production-only install this is not free.
- A change to a runtime-configured value is a content change, not a deploy: it takes effect through `revalidatePath`, not through a rebuild.
- Migrations stay backwards compatible (expand/contract), because the same image runs against every Installation's database and a rolling replacement spans old and new containers.

## Considered options

- **Build one image per Installation** (the de facto behaviour today, since Nixpacks builds per app): keeps build-time prerendering and needs no changes to the app. Rejected: N builds per release, a release that fails for one Tenant leaves the Fleet on mixed versions, the build requires every tenant database to be reachable and healthy, and it still does not remove the need for runtime configuration, because the domain and the publishable keys would otherwise be baked in.
- **One multi-tenant application with a tenant column**: far cheaper per customer and no provisioning. Rejected: 71 models and three singletons that are single-row by construction (`Settings` via `findFirst`/`updateMany({})`, `EmailSetting`, `Integration.provider` unique), plus no row-level isolation — a rewrite of the data layer, not a feature.
- **Hybrid: per-Installation container, shared storage and scheduler**: keeps the provisioning model but reintroduces coupling in exactly the places where isolation is the reason customers choose to self-host. Rejected.
