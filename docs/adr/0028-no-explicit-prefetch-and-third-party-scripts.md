# No explicit prefetch on public links; keep GTM and Iubenda synchronous

Public-facing links (navbar, footer, sidebar, widgets, latest-news/services sections, post/product cards, pagination, and TipTap-rendered body links) used to pass the `prefetch` prop on almost every `<Link>`. In the App Router, `prefetch={true}` forces the full route to be prefetched for both static and dynamic destinations, so every link in the viewport downloads the destination's RSC payload and route chunks even when the visitor never opens it. The public site pays that cost on first paint, competing with the LCP image and hydration.

We decided to remove the explicit `prefetch` prop and rely on the App Router default (`prefetch="auto"`): static routes are prefetched in full, while dynamic routes prefetch only down to the nearest `loading.js` boundary, and hovering still triggers a fetch. This preserves instant-feeling client navigation while stopping full prefetches of dynamic pages. We rejected `prefetch={false}` because it also disables hover prefetching and makes navigations feel slower. We rejected route-segment `prefetch` config because the problem was per-link opt-in, not a route-level policy. Per-link `prefetch={false}` remains allowed where a link genuinely should never be prefetched.

## Third-party scripts

Two script paths must stay as they are:

- **Google Tag Manager** is rendered from the public root layout with `<GoogleTagManager>` from `@next/third-parties/google`. It loads through `next/script` with the default `afterInteractive` strategy. This change does not alter that timing. Moving GTM to `lazyOnload`, or removing it, would delay when GTM and the tags it controls (including consent-mode and analytics tags) fire; that is an analytics/compliance decision, not a bundle-size cleanup.
- **Iubenda** is loaded by `AppScripts` from `settings.scripts`. Each script's `strategy` is stored with the script and may be `beforeInteractive` (used by Iubenda for the cookie banner/CMP). `AppScripts` passes the stored strategy through unchanged, so any `beforeInteractive` Iubenda script remains `beforeInteractive`. Changing or removing those scripts would change when the consent banner and CMP run, which is a GDPR/consent decision, not a performance one. This change therefore does not touch `AppScripts`, the settings script model, or the GTM component.

## Consequences

- Public links no longer pay full-route prefetch cost for dynamic destinations.
- Default App Router prefetching still warms static routes and supports hover prefetch.
- GTM and Iubenda keep their current timing and compliance behavior.
- If bandwidth becomes more important than navigation latency, individual links can opt out with `prefetch={false}`; the default is intentionally left intact.
