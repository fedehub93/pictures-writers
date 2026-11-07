---
Status: ready-for-agent
Type: task
Blocked by: 02
---

# Plain navigation items

## Goal

Match the retired hardcoded navbar's look: navigation entries have no surface of their own, and hover/active only recolour the text.

## Acceptance criteria

- [ ] Top-level links and column/card triggers have a transparent background, keep `rounded-md`, and on hover change only the text colour to primary. The open state (`data-[state=open]`) does not paint a background.
- [ ] The active entry is marked with primary text, not with a filled background.
- [ ] Dropdown and column links (`NavLinkList`) lose their hover background and their active background; hover is primary text, active is primary text.
- [ ] Mobile rows and mobile accordion triggers follow the same rules (no hover background, primary text on hover/active, no underline on the trigger).
- [ ] The CTA keeps its filled button and the mega cards keep their border/surface and hover background.
- [ ] The keyboard focus ring (`focus-visible`) is preserved on every interactive entry.
- [ ] Other `NavigationMenu` consumers keep their current surface look; only the NavbarBlock opts into the plain variant.
- [ ] Tests assert the plain classes on the top-level, dropdown and mobile projections, and no longer assert `hover:bg-accent` on those links.
- [ ] `npx tsc --noEmit`, targeted ESLint, `npm run test:run` and `npm run build` pass.

## Hints

- Prefer teaching the shared primitive a look: split `navigationMenuTriggerStyle` into a base class plus a complete `look: "surface" | "plain"` variant, defaulting to `surface`, and give `NavigationMenuTrigger` a matching `look` prop. Each variant must carry its **whole** background/hover class set, not add `bg-transparent` on top of `bg-background`: same-property Tailwind utilities are resolved by stylesheet order, not by class-attribute order.
- If a primitive change is undesirable, compose the full plain class string inside `NavbarBlock` and stop using `navigationMenuTriggerStyle()` there. Do not rely on `bg-transparent` overriding `bg-background`.
- Files: `src/shared/ui/navigation-menu.tsx` (if extending the primitive), `src/puck/blocks/NavbarBlock/ui/desktop-menu.tsx`, `ui/nav-link-list.tsx`, `ui/mobile-menu.tsx`.
- Keep `MOBILE_LINK_CLASSES`, `NavLinkList` and `NavbarMobileColumnList` on the same treatment; the mobile active row currently uses `bg-accent text-accent-foreground`.
- `NavbarCard` is out of scope: it is a card, not an entry.

## Out of scope

- A toggle between the plain and surface looks. The plain look is the NavbarBlock's defined appearance.
- Restyling the CTA or the cards.
