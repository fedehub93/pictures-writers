# 04 — Render without build-time data

Status: ready-for-agent
Blocked by: —

## Problem

Five routes call `generateStaticParams` with Prisma during `next build`, so the build needs one specific database and bakes its content into the artefact. ADR-0036 requires the build to run with no database at all.

## What

- Stop pre-warming slugs at build time in `[...slug]`, `blog/[slug]`, `shop/[categorySlug]/[productSlug]`, `shop/.../submission`, `draft/[...slug]`.
- Keep `dynamicParams = true` and `revalidate = 86400`.
- Ensure no `headers()` or `cookies()` is used in the public rendering path, so pages stay cacheable.
- Confirm `sitemap.ts`, `robots.ts`, `llms*.txt/route.ts` and the metadata helpers keep their current revalidation behaviour once they read the database at request time.
- Add a documented warmup contract for the Control plane (list of URLs), but no warmup code in the app.

## Done when

- `next build` succeeds with `DATABASE_URL` pointing at a nonexistent host.
- Every public route renders on cold cache and is then served from cache.
- No page becomes `force-dynamic` as a side effect.

## Production impact

Pages stay cached; only the first request per route after a deploy or cache eviction pays a render. Measure it and record the number. Until the Control plane exists, run the warmup by hand after each deploy.
