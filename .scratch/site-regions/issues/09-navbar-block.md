---
Status: done
Type: task
Blocked by: 08
---

# Create the NavbarBlock for responsive navigation

## Goal

Replace the static big menu with a configurable, responsive Puck block.

## Acceptance criteria

- [x] `src/puck/blocks/NavbarBlock/` stores its menu as a typed JSON tree.
- [x] Supported item types: `link`, `column`, `card`, `cta`.
- [x] `link` items support `SmartLink` resolution.
- [x] Desktop rendering uses a big menu / mega menu layout.
- [x] Mobile rendering uses a sheet/accordion layout.
- [x] `src/modules/site-regions/server/resolve-menu-links.ts` resolves entity references in the menu tree server-side.
- [x] Block is available in the Header palette only.

## Menu item schema (v1)

```ts
type NavItem =
  | { type: "link"; label: string; link: SmartLink }
  | { type: "column"; label: string; items: { label: string; link: SmartLink }[] }
  | { type: "card"; label: string; description?: string; imageUrl?: string; link: SmartLink }
  | { type: "cta"; label: string; link: SmartLink; variant?: "primary" | "secondary" };
```

## Hints

- Do not use generic Puck children for menu items; keep the schema typed.
- Use the existing `NavigationMenu` shadcn component for the desktop view if suitable.
- Use the existing mobile sheet pattern from `src/app/(home)/_components/navbar/_components/mobile-navbar.tsx`.

## Out of scope

- Multiple menus or reusable `NavigationMenu` entity.

## Notes

- `src/puck/blocks/NavbarBlock/types.ts` is the stored `NavItem` discriminated union (`link`, `column`, `card`, `cta`) plus the runtime `NavItemUi` and `ResolvedNavItem` shapes. The block deliberately does not use Puck children.
- The editor uses a custom `MenuItemsField` (`field.tsx` + `ui/menu-items-editor.tsx`) because a generic Puck array cannot express a discriminated union. It reuses the existing `LinkView`, so every item type picks a SmartLink with the same CMS entity picker as the Link block. Column sub-links are edited inside the column card; card items add description/image URL; CTA items add a primary/secondary variant.
- Desktop rendering is a shadcn `NavigationMenu`: `link`/`cta` render inline, `column` opens a wide mega panel (2-column grid by default, compact single column with `layout="compact"`) and `card` opens a rich image/description panel.
- Mobile rendering reuses the existing sheet pattern from the static navbar: a `Sheet` from the left with `Accordion` sections for columns, rich cards for `card` items and full-width buttons for CTAs. Both projections share `NavLinkList` and `NavbarCard`.
- `NavbarBlockServer` resolves the tree with `src/modules/site-regions/server/resolve-menu-links.ts` before passing it to the client component. The resolver is idempotent: the cached region query already runs the generic SmartLink walker, so it also accepts the `{ label, href }` shape and makes no database call for already-resolved links. It resolves link/column/card/cta uniformly and keeps a missing/unpublished target as a labelled link with no href, which renders as plain text.
- Active-link highlighting (`isNavLinkActive`) normalizes the trailing slash used by `trailingSlash: true` and treats a section link as active for its children. It was not in the ticket but came free with the navigation projections.
- Palette wiring: `NavbarBlock` joined `HEADER_ONLY_COMPONENTS`, `RENDER_COMPONENT_NAMES`, `regionOnlyRenderComponentConfigs` (with the server renderer), `editorComponentConfigs` and the editor "Header" category. It is absent from the footer and page palettes.
- Tests: `navbar-block.test.tsx` covers desktop/mobile rendering, column links, cards, active-link logic, config defaults and the custom field. `resolve-menu-links.test.ts` covers every item type, entity labels, broken/unpublished targets, pre-resolved input and input immutability. `region-render-config.test.ts` / `region-editor-config.test.ts` lock `NavbarBlock` to the Header palette only. `npx tsc --noEmit` clean; targeted ESLint clean (only the pre-existing `any` warnings in `render-config.tsx`). Full suite: 215 files / 1779 tests.
