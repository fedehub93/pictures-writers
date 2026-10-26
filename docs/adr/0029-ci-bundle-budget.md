# CI bundle budget from the Turbopack analyzer

The public site's Lighthouse budget is only useful if bundle regressions are caught before they ship. The repo already had `@next/bundle-analyzer`, but that plugin wraps `webpack-bundle-analyzer`; Next.js 16's default build is Turbopack, so the legacy report does not reflect the bundle we actually ship.

We added a CI budget that runs `next experimental-analyze --output`, reads the per-route analyzer data from `.next/diagnostics/analyze/data`, and compares compressed client JS/CSS sizes for a set of key public routes against `perf/bundle-budget.json`. The script reports per-route headroom, deltas against a committed baseline snapshot, chunk counts, and the largest client chunk. Budgets fail the check; the baseline only informs the report.

Initial budgets are deliberately generous (roughly 30-55% headroom) so the first version does not block development. They can be tightened once the baseline has been stable for a few releases.

We rejected the Webpack analyzer because it is not the shipped bundler. We rejected a hardcoded size snapshot as the pass/fail gate because every accepted change would require a noisy baseline update and unrelated chunk-boundary shifts would fail builds. A budget with an informational baseline keeps the gate stable while still showing reviewers what moved.

Consequences: key routes now have an explicit size ceiling; adding a dependency that pushes a route over budget requires an intentional threshold update; the script depends on Next's experimental analyzer output format and must be revisited if that format changes.

## Considered options

- **Turbopack analyzer + budgets (chosen)**: measures the shipped bundler and gives stable pass/fail thresholds.
- **Webpack analyzer**: wrong bundler, slower, and already known to lag the Turbopack build.
- **Committed size snapshot as the gate**: too brittle; harmless chunk-boundary changes would fail.

## Consequences

- CI reports budget headroom and baseline deltas on every pull request.
- Only budgets block merges.
- `docs/performance/bundle-budget.md` documents how to update thresholds and the baseline.
