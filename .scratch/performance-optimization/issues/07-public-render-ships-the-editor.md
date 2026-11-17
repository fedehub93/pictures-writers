# 07: The public render ships the Puck editor runtime

**What to build:** Bring the public page JS back down after the Site regions change, which put the Puck render runtime on every page and pushed the key routes from 704 KiB to 1.4 MiB of compressed client JS. Pick the cheapest lever that keeps the canvas and the published page drawing the same tree (ADR-0040), starting with the icon set.

**Status:** ready-for-agent

- [ ] Measure the client graph for `/` against `master` and record which modules the Site regions change added.
- [ ] Stop shipping the whole lucide icon set: the NavbarBlock glyph goes through `lucide-react/dynamic`, whose `dynamicIconImports` map puts every glyph in the graph.
- [ ] Check whether the page path imports any value (not type) from `@/generated/prisma`: the browser Prisma runtime is in the client graph.
- [ ] Decide whether the rich text schema belongs in the client on the published page, or whether the stored content can be turned into HTML on the server.
- [ ] Lower the budgets in `perf/bundle-budget.json` back down once the levers land, one route at a time.

## Notes

Measured on the Site regions branch with `npm run bundle:analyze` and `npm run bundle:budget`, against the budgets recorded when the guardrail was introduced (ADR-0029):

| Route | Before (baseline) | After | Delta |
| --- | ---: | ---: | ---: |
| `/` | 704,865 B | 1,429,237 B | +707.4 KiB (+102.8%) |
| `/blog/[slug]` | 357,285 B | 1,387,259 B | +1005.8 KiB (+288.3%) |
| `/shop` (and the two shop subroutes) | 1,138,552 B | 1,688,773 B | +537.3 KiB (+48.3%) |
| `/shop/checkout` | 352,064 B | 1,385,201 B | +1008.9 KiB (+293.5%) |
| `/sign-in` | 418,892 B | 400,527 B | -17.9 KiB (-4.4%) |
| CSS, every `(home)` route | 35,007 B | 51,544 B | +16.1 KiB (+47.2%) |

`/sign-in` sits outside the `(home)` layout and moved by 4.4%, so the measurement itself is stable: the growth belongs to the site layout, not to the analyzer or the toolchain.

Totals in the `/` client graph after the change, by package (compressed, from the analyzer's per-module sizes):

| Package or folder | Compressed |
| --- | ---: |
| `lucide-react` (mostly `dynamicIconImports` plus one module per glyph) | 377.0 KiB |
| `next` runtime and polyfills | 213.3 KiB |
| `zod` | 130.2 KiB |
| `src/shared/ui` (`icons-data.ts` alone is 44.0 KiB) | 81.0 KiB |
| `src/modules/forms` | 31.5 KiB |
| `@tiptap/*` | 45.6 KiB |
| `prosemirror-*` | 54.7 KiB |
| `@dnd-kit/*` | 24.7 KiB |
| `axios` | 24.3 KiB |
| `slugify` | 17.0 KiB |
| `@prisma/client-runtime-utils` + `generated/prisma/index-browser.js` | 19.2 KiB |

These are totals, not deltas; the analyzer reports sizes per module but not importers, so the split between "already there on `master`" and "added here" still needs a build of `master` for the same routes.

The lucide line is the first lever because it is the largest and the most accidental. `src/puck/blocks/NavbarBlock/ui/navbar-icon.tsx` renders a menu item's glyph with `DynamicIcon`, and `dynamicIconImports` is a map of every icon, so the published page carries the whole set to draw one or two glyphs. A bounded map of the icons the CMS offers, or rendering the glyph on the server, would recover most of it without touching the canvas contract.

`perf/bundle-budget.json` was raised in the commit that caused the growth, so the guardrail reports deltas instead of failing: `/` 1,650,000 B, `/blog/[slug]` and `/shop/checkout` 1,600,000 B, the shop routes 1,950,000 B, CSS 60,000 B. `perf/bundle-budget.baseline.json` is deliberately untouched: `docs/performance/bundle-budget.md` asks for the refresh in a separate chore PR so the growth stays visible in review.
