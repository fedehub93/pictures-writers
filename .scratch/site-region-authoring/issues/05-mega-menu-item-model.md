---
Status: done
Type: task
Blocked by: 02
---

# Mega menu item model

## Goal

Reproduce the production mega menu — one trigger opening a grid of cards with icon, title and description — from the NavbarBlock editor, without changing the typed JSON tree into Puck children.

## Acceptance criteria

- [x] A `column` child is `{ label, link, description?, icon? }`; `icon` reuses the shared Icon field, `description` is optional text.
- [x] Icons are offered on `column` children and on `card` items only, not on top-level `link` or `cta`.
- [x] In the `mega` layout a column renders as a two-column grid of cards with the icon, the label and the description; the panel widths match the production header (up to ~37.5rem at desktop).
- [x] In the `compact` layout a column keeps rendering as a single-column list of links.
- [x] A column whose children have neither description nor icon renders exactly as before, so existing documents do not change.
- [x] On mobile the same content is projected as an accordion whose rows show icon, label and description.
- [x] `mega`/`compact` remains one setting for the whole NavbarBlock.
- [x] Server link resolution keeps working for every child, including unresolved targets (label without anchor).
- [x] Tests: mega column with icons/descriptions, compact column unchanged, legacy column unchanged, mobile accordion content, unresolved child link, editor field shape.

## Implementation notes

- **Model.** `types.ts` adds `NavbarColumnChild` / `NavbarColumnChildUi` / `ResolvedNavbarColumnChild` with optional `description` and `icon` (`IconProps` from the shared Icon field). `card` items gain the same optional `icon`. The tree stays a closed discriminated union in `content.items`; `mega`/`compact` is still one `content.layout`.
- **Mega panel.** `NavbarDesktopColumnPanel` promotes a mega column to cards when at least one child has a description or icon, using `NavbarCard` (the shared presentation also used by `card` items) in a `grid-cols-2` panel. The panel width follows the production ladder: `min(90vw, 31.25rem)` from `md` and `min(90vw, 37.5rem)` from `lg`. Columns without panel content, and every compact column, keep the previous `NavLinkList` markup untouched.
- **Mobile.** `NavbarMobileColumnList` renders the accordion rows with icon, label and description; columns without panel content keep the previous plain `NavLinkList`. Mobile ignores `layout` by design: the sheet is its own projection and `layout` remains the desktop presentation.
- **Icons.** `NavbarIcon` is the single wrapper both the card and the mobile row use. It reuses the dynamic `Icon` from `@/shared/ui/icon-picker`, exactly like the standalone Icon block. `DynamicIcon` resolves lazily on the client, so server markup contains the positioned wrapper but not the glyph — the same behaviour as every other icon on the site.
- **Editor.** `MenuItemsEditor` adds a description textarea and an inline `IconView` (the shared Icon field view) to `column` children, and an inline `IconView` to `card` items. Top-level `link` and `cta` items expose neither. `createColumnLink` became `createColumnChild`.
- **Resolver.** `resolve-menu-links.ts` keeps `description` and `icon` for column children and `icon` for cards; unresolved entity targets still resolve to `{ label, href: undefined }` and render as plain text.
- **Tests.** `navbar-block.test.tsx` covers the mega panel grid and widths, compact/legacy behaviour, the mobile row component, editor icon/description exposure per item type, and the custom field shape. `navbar-mobile-accordion.test.tsx` (happy-dom) opens the real mobile accordion and asserts the projected rows. `resolve-menu-links.test.ts` now asserts description/icon preservation and the unresolved child.

## Verification

- `npx tsc --noEmit` clean.
- Targeted ESLint on the changed files is clean.
- `npm run test:run`: 228 files / 1901 tests pass.
