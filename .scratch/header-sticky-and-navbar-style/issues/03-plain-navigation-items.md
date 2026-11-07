---
Status: done
Type: task
Blocked by: 02
---

# Plain navigation items

## Goal

Match the retired hardcoded navbar's look: navigation entries have no surface of their own, and hover/active only recolour the text.

## Acceptance criteria

- [x] Top-level links and column/card triggers have a transparent background, keep `rounded-md`, and on hover change only the text colour to primary. The open state (`data-[state=open]`) does not paint a background.
- [x] The active entry is marked with primary text, not with a filled background.
- [x] Dropdown and column links (`NavLinkList`) lose their hover background and their active background; hover is primary text, active is primary text.
- [x] Mobile rows and mobile accordion triggers follow the same rules (no hover background, primary text on hover/active, no underline on the trigger).
- [x] The CTA keeps its filled button and the mega cards keep their border/surface and hover background.
- [x] The keyboard focus ring (`focus-visible`) is preserved on every interactive entry.
- [x] Other `NavigationMenu` consumers keep their current surface look; only the NavbarBlock opts into the plain variant.
- [x] Tests assert the plain classes on the top-level, dropdown and mobile projections, and no longer assert `hover:bg-accent` on those links.
- [x] `npx tsc --noEmit`, targeted ESLint, `npm run test:run` and `npm run build` pass.

## Implementation notes

- **Shared primitive.** `navigationMenuTriggerStyle` is now `cva(base, { variants: { look } })` with `surface` as the default and `plain` carrying its complete background/hover/focus set (`bg-transparent`, `hover:text-primary`, `data-[state=open]:bg-transparent`, `focus-visible:ring-2`). `NavigationMenuTrigger` accepts the matching `look` prop. The surface variant is byte-for-byte the previous look, so the retired `Nav` and any other consumer are unchanged.
- **Plain entries.** `NavbarDesktopMenu` calls `navigationMenuTriggerStyle({ look: "plain" })` for links and `look="plain"` for column/card triggers. `NavLinkList` and `NavbarMobileColumnList` share `NAV_LINK_PLAIN_CLASSES` (`nav-link-list.tsx`) with the mobile sheet rows: no hover/active background, primary text on hover/active, and a visible focus ring.
- **Active triggers.** `hasActiveNavChild` (`lib/menu.ts`) marks a column trigger primary when one of its children is the current page, matching the retired navbar. Card triggers use their own link.
- **Untouched.** The CTA still uses `buttonVariants`; mega `NavbarCard`s keep `bg-background`, border and `hover:bg-accent`.
- **Tests.** `src/shared/ui/__tests__/navigation-menu.test.tsx` covers the surface default and the plain variant; `src/puck/__tests__/navbar-block.test.tsx` covers the top-level, dropdown, mobile and CTA/card projections and asserts the absence of `hover:bg-accent`/`bg-accent` on plain entries.

## Verification

- `npx tsc --noEmit` — clean.
- Targeted ESLint on the changed files — clean. Full `npm run lint` still reports the repo's pre-existing errors elsewhere.
- `npm run test:run` — 234 files, 1936 tests passed.
- `npm run build` — passed (Next.js 16.3.4, 364 static pages).


## Hints

- Prefer teaching the shared primitive a look: split `navigationMenuTriggerStyle` into a base class plus a complete `look: "surface" | "plain"` variant, defaulting to `surface`, and give `NavigationMenuTrigger` a matching `look` prop. Each variant must carry its **whole** background/hover class set, not add `bg-transparent` on top of `bg-background`: same-property Tailwind utilities are resolved by stylesheet order, not by class-attribute order.
- If a primitive change is undesirable, compose the full plain class string inside `NavbarBlock` and stop using `navigationMenuTriggerStyle()` there. Do not rely on `bg-transparent` overriding `bg-background`.
- Files: `src/shared/ui/navigation-menu.tsx` (if extending the primitive), `src/puck/blocks/NavbarBlock/ui/desktop-menu.tsx`, `ui/nav-link-list.tsx`, `ui/mobile-menu.tsx`.
- Keep `MOBILE_LINK_CLASSES`, `NavLinkList` and `NavbarMobileColumnList` on the same treatment; the mobile active row currently uses `bg-accent text-accent-foreground`.
- `NavbarCard` is out of scope: it is a card, not an entry.

## Out of scope

- A toggle between the plain and surface looks. The plain look is the NavbarBlock's defined appearance.
- Restyling the CTA or the cards.
