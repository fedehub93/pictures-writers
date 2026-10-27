# No explicit prefetch on public links; GTM stays afterInteractive

Public-facing links (navbar, footer, sidebar, widgets, latest-news/services sections, post/product cards, pagination, and TipTap-rendered body links) used to pass the `prefetch` prop on almost every `<Link>`. In the App Router, `prefetch={true}` forces the full route to be prefetched for both static and dynamic destinations, so every link in the viewport downloads the destination's RSC payload and route chunks even when the visitor never opens it. The public site pays that cost on first paint, competing with the LCP image and hydration.

We decided to remove the explicit `prefetch` prop and rely on the App Router default (`prefetch="auto"`): static routes are prefetched in full, while dynamic routes prefetch only down to the nearest `loading.js` boundary, and hovering still triggers a fetch. This preserves instant-feeling client navigation while stopping full prefetches of dynamic pages. We rejected `prefetch={false}` because it also disables hover prefetching and makes navigations feel slower. We rejected route-segment `prefetch` config because the problem was per-link opt-in, not a route-level policy. Per-link `prefetch={false}` remains allowed where a link genuinely should never be prefetched.

## Third-party scripts

- **Google Tag Manager** is rendered from the public root layout with `<GoogleTagManager>` from `@next/third-parties/google`. It loads through `next/script` with the `afterInteractive` strategy, after the CMP block. Moving GTM to `lazyOnload`, moving it before the CMP, or removing it would delay or reorder when GTM and the tags it controls (including consent-mode and analytics tags) fire; that is an analytics/compliance decision, not a bundle-size cleanup.
- **Iubenda** is no longer loaded by `AppScripts` from `settings.scripts`. It is an Integration provider rendered from the public root layout before GTM as raw head markup: the inline `_iub.csConfiguration` block, the configured loader, then the asynchronous runtime (see ADR 0031). The old Iubenda rows are removed from the script list during cutover. `AppScripts` keeps no provider-specific rules, and a persisted `beforeInteractive` value renders as `afterInteractive`. Changing the CMP order or the scripts is a GDPR/consent decision, not a performance one.

## Consequences

- Public links no longer pay full-route prefetch cost for dynamic destinations.
- Default App Router prefetching still warms static routes and supports hover prefetch.
- GTM keeps its `afterInteractive` timing; Iubenda's consent behaviour moved from `settings.scripts` to the Integration, still ahead of GTM and now under ADR 0031.
- If bandwidth becomes more important than navigation latency, individual links can opt out with `prefetch={false}`; the default is intentionally left intact.
