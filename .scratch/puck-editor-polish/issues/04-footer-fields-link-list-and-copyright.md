# 04: Footer fields: Link list and Copyright with shared links editor

**What to build:** The Link list and Copyright blocks each configure their whole content in one section, and both use the same inline link editor. The Copyright block also previews the real Installation site name in the canvas. Link resolution and the current footer look stay unchanged.

**Blocked by:** 01 (editor controls and shared content-field wrapper), 02 (Installation settings metadata)

**Status:** done

- [x] Link list exposes one Link list section controlling a nested `content` object with `title` and `links`.
- [x] Copyright exposes one Copyright section controlling a nested `content` object with `showYear`, `extraText` and `links`.
- [x] A shared inline links editor is used by both blocks, with the same add, remove, reorder and edit behaviour in each.
- [x] The links editor reuses the existing link field so SmartLink targets resolve as before.
- [x] The Copyright canvas render uses the metadata site name as a fallback, so the footer line previews the real name without a browser fetch.
- [x] The public Copyright renderer still reads Installation settings on the server, and server-provided values take precedence over metadata.
- [x] Existing link-resolution behaviour for resolved and unresolved entity links is preserved.
- [x] Tests cover the nested content shapes, the shared links editor output, the metadata-driven Copyright preview, server-props precedence and link resolution.
- [x] Type checking, targeted linting, the full test suite and the production build pass.

## Implementation notes

- `LinkList` content is now `{ title, links }` and `Copyright` content is `{ showYear, extraText, links }`. Both blocks expose only their content section plus the shared dimension and typography fields; the old flat props are gone.
- `src/puck/fields/link/ui/links-editor.tsx` is the shared inline links editor. It renders one bordered row per link with move up/down and remove controls, uses `LinkView` (the same SmartLink controls as the Link field) inside each row, and offers an "Add link" action. `LinksSection` wraps it with the shared property header and reset affordance, and both `LinkList/field.tsx` and `Copyright/field.tsx` render that section inside their content accordion.
- `src/puck/fields/link/lib/links.ts` holds the pure add, update, remove and reorder operations, so the shared behaviour is testable without mounting the editor and every change returns a new array for Puck undo/redo. `EMPTY_LINK` is exported from there so the editor does not repeat the empty-link literal.
- `LinkView` gained an optional `idPrefix`; the shared editor passes `link-<index>-`, so several link rows in one properties panel no longer duplicate the type/label/URL ids. Existing single-link consumers keep their ids unchanged.
- The native `LinksField` array descriptor was removed: the footer blocks were its only consumers and it had become dead code once the inline editor replaced it.
- `LINK_LIST_DEFAULT_CONTENT` and `COPYRIGHT_DEFAULT_CONTENT` live in each block's `defaults.ts`; the editor defaults, the generic Site region fallback and the renderer read the same values.
- `CopyrightEditorRender` reads `puck.metadata` through `readSiteRegionMetadata` and passes it to the pure render. `renderCopyrightBlock` uses `siteName?.trim() || metadata?.siteName`, so the canvas previews the Installation name while explicit server props still win. `CopyrightServer` continues to read Installation settings.
- Link resolution needs no change: `resolveSmartLinksInPuckData` walks values recursively, so links nested under `content` resolve exactly as before. The resolver test now exercises the nested shape.
- Tests: `links-editor.test.tsx` renders the real `LinkView` controls (only the tRPC hook is stubbed), covers unique ids across rows, legacy normalization, add/remove/reorder controls, wires both content fields, and exercises the pure item operations; `link-list-block.test.tsx` and `copyright-block.test.tsx` cover the nested content shapes, unresolved/resolved links and the metadata preview plus server-props precedence; `copyright-server.test.tsx` keeps the Settings read; `render-pipeline.test.tsx`, `default-regions.test.ts` and `resolve-link.test.ts` were updated to the nested shapes.
- Verification: `npx tsc --noEmit`, targeted `npx eslint`, `npm run test:run` (223 files / 1853 tests) and `npm run build` pass.

## Notes

- There is intentionally no runtime compatibility layer: documents saved with the old flat props are converted by the issue 05 migration utility.
- The links editor keys rows by index, matching Puck's native array behaviour; the item model has no stable identity.
