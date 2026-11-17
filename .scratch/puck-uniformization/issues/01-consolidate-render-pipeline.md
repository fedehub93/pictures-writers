# 01: Consolidate the public render pipeline

**What to build:** The public Site region and page rendering use the same per-block render implementation as the editor canvas. Each Puck block exposes one pure render function that imports only its UI and the shared style-variable utilities; the public render config consumes that function instead of a copied render body. Blocks that read Installation settings or resolve CMS links keep their server renderer for the public path, while the editor canvas stays database-free.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Every Puck block has a single render implementation consumed by both the editor config and the public render config; no render body is duplicated between them.
- [x] Blocks with a server renderer keep it for the public path, and the editor canvas does not gain a database dependency.
- [x] The public render path does not import editor field modules.
- [x] Block markup, link resolution and Site region output are unchanged.
- [x] The existing block tests, region config tests, type check, lint and test suite pass.

## Implementation notes

- Added a `render.tsx` pure render module to every block (Container, Flex, Grid, Image, Form, Separator, Icon, Heading, Text, Link, Brand, LinkList, Copyright, AnnouncementBar, SearchBar, NavbarBlock) and to the root. Each editor config now assigns that function to `render`.
- Moved the inline props of Container, Flex, Grid, Image, Form, Separator, Icon, Heading and Link into block-local `types.ts` modules; the public type names are re-exported unchanged.
- `render-config.tsx` consumes the same pure renders. It imports no block editor config module, so the public path no longer pulls in `LinkField`, `LinksField`, `DimensionField`, `TypographyField`, `DecorationField` or the rich-text editor menu.
- Brand, Copyright and NavbarBlock keep their server renderers; the server renderer now enriches props and delegates to the shared pure render. The editor canvas remains database-free.
- Public render behaviour is preserved:
  - Container, Flex and Grid apply their editor-only `flex-1` slot classes only when `puck.isEditing`, so public markup is unchanged.
  - Separator uses `SeparatorBlockUi` (the public wrapper) in both paths, so the public wrapper is kept instead of dropped.
  - Only the field descriptors Puck needs for slot and rich-text transforms remain in the public config.
- Added `src/puck/__tests__/render-pipeline.test.tsx`: parameterised editor-vs-public markup equivalence for every client-safe shared block, an assertion that editor-only layout classes stay out of public markup, and an integration render of LinkList and AnnouncementBar through `PuckRender` with the real region configs.
- Verification: `npx tsc --noEmit`, `npx eslint src/puck` (0 errors), `npm run test:run` (218 files / 1799 tests) and `npm run build` all pass. The repository-wide `npm run lint` still reports pre-existing errors in unrelated files.
