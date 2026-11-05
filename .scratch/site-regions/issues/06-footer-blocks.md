---
Status: done
Type: task
Blocked by: 04, 05
---

# Create footer-specific Puck blocks: LinkList and Copyright

## Goal

Provide the blocks needed to recreate the current footer visually in the Footer region.

## Acceptance criteria

- [x] `src/puck/blocks/LinkList/` renders a titled `<ul>` of links. Props: `title`, `links[]` (using `SmartLink`).
- [x] `src/puck/blocks/Copyright/` renders `© <year> <siteName>` plus optional extra text and links. Reads from Settings.
- [x] Both blocks are available in the Footer palette only.
- [x] The current footer (`src/app/(home)/_components/footer.tsx`) can be reproduced by combining `Container`/`Grid`, `Brand`, `Text`, `LinkList` and `Copyright`.

## Hints

- Use `resolve-link.ts` from ticket 05 for `LinkList` links.
- For `Copyright`, read Settings via the existing `getSettings` helper.

## Out of scope

- Social links or newsletter blocks.

## Notes

- `LinkList` and `Copyright` live in `regionOnlyRenderComponentConfigs`, which feeds `regionComponentConfigs` but **not** `pageRenderConfig`: the page palette and the Header palette stay free of footer blocks. `FOOTER_RENDER_COMPONENTS` gates them, and `region-render-config.test.ts` locks both directions.
- `LinkListItem` stores one `link` per array row (`links: [{ link: SmartLink }]`). This lets Puck's `array` field reuse the existing `LinkField` editor for each row; the recursive resolver already walks arrays, and a new integration test in `resolve-link.test.ts` covers the `LinkList.links` shape (including "the stored document is not mutated").
- `Copyright` has two renders: a database-free `render` in `index.tsx` for the client editor canvas, and `CopyrightServer` for the public layout. The server renderer reads `siteName` through `getSettings()` per the ticket hint; the editor config never imports server code. `year` defaults inside `CopyrightBlockUi`, so it is computed in one place.
- Broken/unresolved links render as plain text through the shared `InlineSmartLink`, which the existing `Link` block now uses too instead of duplicating the anchor logic.
- **`Brand` was pulled forward from ticket 08.** Acceptance criterion 4 needs it to rebuild the footer's brand column, and the generic default header from ticket 03 already referenced `Brand` but rendered nothing because the block did not exist. `Brand` is now in the shared region palette (Header + Footer, not pages) and reads `siteName`/`logoUrl` from Installation settings via `BrandServer`. Ticket 08 is left with `AnnouncementBar` and `SearchBar`.
- `links[]` remains a list of `{ link }` rows rather than a flat `SmartLink[]`; this is deliberately the editable representation, while the public document still stores `SmartLink` values so `resolve-link.ts` can resolve them at fetch time.
- Tests: `link-list-block.test.tsx`, `copyright-block.test.tsx`, `copyright-server.test.tsx`, `brand-block.test.tsx`, `brand-server.test.tsx`, the extended `region-render-config.test.ts`, and the new array case in `resolve-link.test.ts`. Full suite: 208 files / 1735 tests. `npx tsc --noEmit` clean.
