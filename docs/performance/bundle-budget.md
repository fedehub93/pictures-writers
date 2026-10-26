# Bundle budget

The bundle budget guards the client JavaScript and CSS shipped to key public routes. It uses Next.js 16's Turbopack analyzer (`next experimental-analyze --output`) instead of the legacy Webpack bundle analyzer, then compares the per-route compressed client sizes against the committed budgets.

## Commands

```bash
# Generate Turbopack analyzer output in .next/diagnostics/analyze
npm run bundle:analyze

# Check the key routes against perf/bundle-budget.json
npm run bundle:budget

# Refresh the reference snapshot after an accepted bundle change
npm run bundle:baseline
```

`npm run build:analyze` still runs the older `ANALYZE=true next build` Webpack analyzer. Use `npm run bundle:analyze` for the CI budget.

## What is measured

`perf/bundle-budget.json` lists the key routes and their budgets in bytes:

- `clientJs`: compressed bytes for every `[client-fs]/**/*.js` chunk used by the route.
- `clientCss`: compressed bytes for every `[client-fs]/**/*.css` chunk used by the route.

Server chunks, fonts, and images are excluded. The report shows the number of client chunks, the largest client chunk (compressed size and filename), and the headroom against each budget. Budget deltas are positive when the route is under budget and negative when it is over.

The initial budgets are deliberately generous (roughly 30-55% above the sizes measured when the budget was introduced) so the first version does not block normal development.

`perf/bundle-budget.baseline.json` is an informational snapshot. The CI report shows the delta against it, but only the budgets in `perf/bundle-budget.json` fail the build. Refreshing the baseline does not change pass/fail behaviour; it only keeps the delta report meaningful.

## Updating thresholds

When an intentional bundle change lands:

1. Run `npm run bundle:analyze`.
2. Run `npm run bundle:budget` and confirm the new sizes.
3. If the growth is expected, raise the affected route's `clientJs`/`clientCss` values in `perf/bundle-budget.json`. Prefer a small, explained increase over a blanket raise.
4. Refresh `perf/bundle-budget.baseline.json` with `npm run bundle:baseline` after the change merges, or in a separate chore PR. Refreshing it in the same PR hides the delta that reviewers need to see.
5. Commit the threshold change with the change that caused the growth and explain why in the commit/PR.

If a key route is added to the app, add it to `perf/bundle-budget.json` with a generous starting budget. If a key route is removed or renamed, remove/rename its entry; the script fails loudly when a configured route has no analyzer output.

## CI

`.github/workflows/bundle-budget.yml` runs on every pull request:

1. `npm run bundle:analyze` produces Turbopack analyzer data.
2. `npm run bundle:budget` writes the markdown report.
3. The report is published to the job summary and uploaded as the `bundle-budget-report` artifact.
4. The job fails if any route is over budget or a configured route is missing.

## Caveats

- The analyzer writes a length-prefixed JSON payload followed by binary tables. `scripts/bundle-budget.ts` reads only the first JSON payload. If a future Next.js release changes that format, the script fails with an explicit parse error rather than silently reporting zero.
- Analyzer sizes are build-machine outputs. Budgets should be generous enough to absorb harmless chunk-boundary changes but tight enough to catch a new large dependency.
