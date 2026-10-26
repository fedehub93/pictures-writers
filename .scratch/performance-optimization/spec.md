# Lighthouse performance optimization

The public site has slowed down. Recent Lighthouse runs report mobile scores around 64 and desktop scores below 90, with 1.67 MB of JavaScript in 64 requests and 845 KB flagged as unused. The biggest contributors are the form builder registry dragging TipTap/ProseMirror into the public bundle, a full-namespace Lucide import, aggressive route prefetching, unoptimized third-party scripts, and missed LCP optimizations for the article cover image.

## Solution

A phased, measurable optimization effort:

1. **Lazy-load form element properties components** so the public form runner no longer imports TipTap.
2. **Unify public form validation on Zod** to remove the duplicate Valibot library from the bundle.
3. **Optimize critical assets**: replace the Lucide namespace import with an explicit icon whitelist, optimize the site logo, and prioritize the article cover LCP image.
4. **Reduce explicit prefetching** on shared navigation and document which third-party scripts must stay synchronous for compliance.
5. **Add a CI bundle budget** using the Turbopack bundle analyzer so regressions are caught in PRs.
6. **Spike Zod Mini** as an optional future reduction once the baseline is stable.

Targets: mobile ≥ 85 with third-party scripts, desktop ≥ 90; pursue mobile ≥ 90 where feasible without breaking analytics or GDPR compliance.

## User Stories

1. As a mobile visitor, I want the article page to load quickly, so that I stay and read instead of bouncing.
2. As a mobile visitor, I want JavaScript that I do not need to be deferred or removed, so that the page becomes interactive sooner.
3. As a visitor, I want the site logo and cover image to load efficiently, so that the page feels fast and polished.
4. As a backoffice user, I want the form designer to keep working exactly as before, so that lazy-loading the properties editor does not break my workflow.
5. As a developer, I want the form runner to render forms without importing the rich-text editor, so that the public bundle stays small.
6. As a developer, I want only one validation library for public forms, so that the bundle does not pay for two overlapping parsers.
7. As a developer, I want explicit prefetching removed from shared navigation, so that the browser does not waste bandwidth on pages the visitor may never open.
8. As a compliance officer, I want GTM and Iubenda to keep loading as required by consent/GDPR setup, so that tracking and cookie banner behavior remain correct.
9. As a developer, I want a CI bundle budget, so that future PRs cannot silently reintroduce large bundles.
10. As a developer, I want Lighthouse/PageSpeed Insights measurements before and after each phase, so that every change proves its value.
11. As a visitor, I want article covers to use `fetchPriority="high"` and a preconnected CDN, so that the desktop LCP image paints earlier.
12. As a developer, I want the Lucide icon set restricted to icons actually used by products, so that the entire icon library is not bundled.

## Implementation Decisions

- The form builder registry will keep a single registry file. Each form element's `index.tsx` will lazy-load its `properties-component` so TipTap stays out of the public runner bundle.
- Public form validation will move from Valibot to Zod, because Zod is already required at runtime by the form builder's schema generator.
- The `service-boxs.tsx` Lucide namespace import will be replaced by an explicit whitelist map of allowed icons.
- The site logo will be replaced by an SVG or a smaller WebP with appropriate srcset; this is a manual asset task.
- Article cover images will receive `fetchPriority="high"` and the UploadThing CDN origin will be preconnected.
- Explicit `prefetch` on navbar, footer, sidebar, and widgets will be removed. Browser-default prefetch is sufficient.
- GTM will continue loading immediately because it drives consent mode v2 and early analytics events.
- Iubenda scripts loaded with `beforeInteractive` strategy will stay unchanged for GDPR compliance; only non-essential optimizations will be applied where possible.
- CI bundle budget will use the Next.js 16 Turbopack bundle analyzer output, not the legacy Webpack plugin.
- Zod Mini will be evaluated only after the main phases are measured, because it requires schema syntax changes and resolver compatibility checks.

## Testing Decisions

- Each phase must include a Lighthouse run (mobile + desktop) before and after, captured in the PR description.
- PageSpeed Insights will be used for the real-world mobile score.
- The Turbopack bundle analyzer will be used to verify which chunks disappear or shrink.
- Existing form designer and runner tests must pass after the lazy-loading change.
- Existing form submissions must pass after the Valibot → Zod migration.

## Out of Scope

- A full architectural split into a separate runner registry. Lazy-loading properties is the chosen seam.
- Changing analytics provider or consent model.
- Removing GTM or Iubenda.
- Server-side rendering the form runner differently.

## Further Notes

- Mobile 90 is difficult while GTM and Iubenda remain synchronous. The goal is to remove all avoidable overhead first, then decide whether further third-party deferral is acceptable.
- The cover image LCP improvement applies mainly to desktop, where the cover is the LCP element. On mobile the LCP is currently a paragraph, so JS reduction matters more than image tuning.
