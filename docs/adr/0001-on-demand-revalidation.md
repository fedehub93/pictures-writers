# On-demand revalidation for public content instead of full rebuilds

**Status**: accepted

Public content (posts, Puck pages, shop products) was previously propagated by triggering a full Vercel rebuild after scheduled publication (`triggerWebhookBuild` from the scheduler runner) or via the admin "Build website" button, while immediate publishes relied on a 24h ISR backstop. Every content change therefore required a full application build.

We replace full rebuilds with on-demand revalidation. Public content routes keep ISR with a coarse 24h backstop (`revalidate = 86400`) and `dynamicParams = true` for on-demand generation of new slugs. A shared `revalidateContent()` helper calls `revalidatePath` on the affected surfaces (the content path, `/blog` segment via `layout`, the `/` home layout — which renders `LatestNews` from the DB, blog categories/tags, and `sitemap.xml`) from the publish/unpublish/schedule flows and the scheduler runner. `triggerWebhookBuild()` is removed from those flows; the admin build button remains only as an emergency fallback.

This eliminates full builds for content changes, propagates edits instantly, and behaves identically on Vercel and self-hosted `next start`.

## Considered options

- **Tag-based revalidation with `unstable_cache`**: finer granularity, but requires wrapping DB queries in a cache layer with more surface area. Deferred until a shared expensive query (e.g. settings/navbar) justifies it. Public pages read directly from the DB, so route-level revalidation suffices.
- **Keeping full webhook rebuilds**: simplest to reason about, but one build per content change. Rejected.
- **Fully dynamic rendering (`force-dynamic`)**: no staleness, but loses caching benefits for SEO and TTFB. Rejected.

## Consequences

- On self-hosted `next start`, the ISR cache is in-memory, per-instance, lost on restart, and not shared across replicas. Accepted for a single-instance deployment; revisit when scaling to multiple replicas.
- Freshness now depends on the revalidation calls firing correctly; the 24h ISR backstop is the safety net, not the source of freshness.
