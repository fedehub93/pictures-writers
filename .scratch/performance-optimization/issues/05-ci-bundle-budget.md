# 05: Add CI bundle budget with Turbopack analyzer

**What to build:** Add a CI step that measures bundle sizes from the Turbopack build output and fails when thresholds are exceeded.

**Blocked by:** 01, 02, 03, 04.

**Status:** done

- [x] Use the Next.js 16 Turbopack bundle analyzer to capture bundle sizes for key routes and chunks.
- [x] Write a CI script that compares sizes against documented thresholds.
- [x] Set initial thresholds generously so the first version does not block development.
- [x] Run the budget on pull requests and report size deltas.
- [x] Document how to update thresholds when intentional bundle changes land.

## Notes

The budget uses Next.js 16's Turbopack analyzer, not the legacy Webpack plugin. `npm run bundle:analyze` runs `next experimental-analyze --output`, which writes per-route data to `.next/diagnostics/analyze/data`. `scripts/bundle-budget.ts` parses the length-prefixed JSON payload, sums compressed client `[client-fs]` JS and CSS per route, and ignores server chunks, fonts, and images. It also reports the client chunk count and the largest client chunk (filename and compressed size) per route.

`perf/bundle-budget.json` holds the initial budgets for seven key routes: `/`, `/blog/[slug]`, `/shop`, `/shop/[categorySlug]`, `/shop/[categorySlug]/[productSlug]`, `/shop/checkout`, and `/sign-in`. The budgets are roughly 30-55% above the measured baseline, so the first version is intentionally permissive.

`perf/bundle-budget.baseline.json` is an informational snapshot. The report includes delta and percentage change against it, but only the budgets in `perf/bundle-budget.json` fail CI. `npm run bundle:baseline` refreshes the snapshot after an intentional change; refreshing it on `main` (or in a separate chore PR) keeps PR deltas meaningful.

CI runs in `.github/workflows/bundle-budget.yml` on every pull request. It writes the markdown report to the job summary and uploads it as the `bundle-budget-report` artifact; the job fails if any route is over budget or a configured route has no analyzer output. The update procedure is documented in `docs/performance/bundle-budget.md`, with the decision recorded in `docs/adr/0029-ci-bundle-budget.md`.

The measured baseline is committed in `perf/bundle-budget.baseline.json`.

Verification:

- `npx tsc --noEmit` passes.
- `npx vitest run "scripts/__tests__/bundle-budget.test.ts"` passes (7 tests: parser, size/chunk collection, within-budget reporting with baseline deltas, over-budget failure, missing-route failure, baseline writing, and no partial baseline on errors).
- `npm run bundle:analyze` completes and `npm run bundle:budget` reports all seven routes within budget.
- `npm run bundle:baseline` wrote `perf/bundle-budget.baseline.json`.
