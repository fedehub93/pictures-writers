---
Status: done
Type: task
---

# Extend the Link block to support CMS entity references

## Goal

Allow any Puck link to point to a CMS entity and resolve server-side.

## Acceptance criteria

- [x] The `Link` block accepts a `SmartLink` value: external URL, page, post, product, blog category or product category.
- [x] Admin UI lets the user pick the link type and the target entity.
- [x] `src/modules/site-regions/server/resolve-link.ts` resolves a `SmartLink` to a final URL and label.
- [x] When a region is fetched, all smart links inside `puckData` are resolved recursively.
- [x] Broken/missing entity references result in the link being hidden or rendered as plain text (decide and document in the ticket).

## Notes

- `SmartLink` lives in `src/puck/fields/link/types.ts` so the server resolver and the editor share one definition. The `Link` prop is `SmartLink & { label?: string }`; old `{ label, href }` documents are normalised to `{ type: "external", url: href }` at render time and keep working.
- Entity references store the CMS **root** id (`PageRoot`, `PostRoot`, `ProductRoot`) or the category id. The server resolver only considers the live version of a root, so linking to a draft-only page/post/product cannot send a visitor to a 404.
- Broken or missing references render as **plain text**: the resolved link keeps the configured label (or the entity title when it could be resolved) and drops the `href`, so `LinkBlockUi` renders a `<span>` instead of an `<a>`. This keeps the layout readable without leaving a dead link. An external link with an empty URL is treated the same way.
- Resolution happens in `getLiveRegionByKey` (the public layout) and in `getPublishedPageBySlug` (Puck pages), so the enhanced block works in both palettes. The admin/editor queries keep the raw SmartLink props so saving a document does not write resolved URLs back into it; `siteRegions.getByKey` opts out with `resolveLinks: false`.
- External links keep their optional `openInNewTab` flag; the renderer adds `target="_blank"` and `rel="noreferrer"`.
- Linked entity changes (title/slug/unpublish) reach the header/footer within the existing 60s Site-region cache TTL; publishing a region itself is immediate via `revalidateTag`.
- Tests: `src/modules/site-regions/server/__tests__/resolve-link.test.ts` covers every target type, broken references, recursive resolution (including slots and zones), published-page integration and the live-region integration. `src/puck/__tests__/link-block.test.tsx` covers anchor/plain-text rendering, new-tab behaviour and legacy documents.


## Hints

- File to edit: `src/puck/blocks/Link/`.
- The resolver must query `PageRoot`, `PostRoot`, `ProductRoot`, `Category`, `ProductCategory`.
- Use a recursive walk over `puckData.content` to find link props.

## Out of scope

- Menu link resolution inside `NavbarBlock` is covered by ticket 09.
