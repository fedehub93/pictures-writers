# 02: Header fields: Brand and Search bar with settings preview

**What to build:** The Brand block and the Search bar block each expose one recognisable content section instead of native radio and text fields, and the Brand block previews the real Installation site name and logo in the canvas. Toggling the logo or the site name now has a visible effect while designing, and the public site keeps rendering from Installation settings exactly as before.

**Blocked by:** 01 (editor controls and shared content-field wrapper)

**Status:** done

- [x] Brand exposes one Brand section controlling a nested `content` object with `showLogo`, `showSiteName`, `customText` and `customLogoUrl`.
- [x] Search bar exposes one Search section controlling a nested `content` object with `placeholder` and `variant`.
- [x] Both blocks no longer expose native radio or text fields for these props.
- [x] The Site region editor passes the Installation site name and logo URL into the Puck editor as metadata.
- [x] The Brand canvas render uses the metadata as a fallback when no server-provided site name or logo is present, so the logo and site-name toggles visibly add or remove content in the canvas.
- [x] The public Brand renderer still reads Installation settings on the server, and server-provided values take precedence over metadata.
- [x] The editor render remains database-free: no browser fetch and no database import in the canvas path.
- [x] Tests cover the nested content shapes, the metadata-driven canvas preview, the server-props precedence, and the existing style variables and custom overrides.
- [x] Type checking, targeted linting, the full test suite and the production build pass.

## Implementation notes

- `src/puck/metadata.ts` defines the `SiteRegionMetadata` shape and `readSiteRegionMetadata`, which validates and trims the untyped Puck metadata bag at the boundary.
- `PuckEditor` now accepts a `metadata` prop and forwards it to Puck. The Site region editor page reads Installation settings and passes `siteName` and `logoUrl`; `SiteRegionEditorView` requires that metadata.
- `src/puck/blocks/Brand/field.tsx` is the Brand content section: two switches and the two override text inputs, with resets compared against `BRAND_DEFAULT_CONTENT`.
- `src/puck/blocks/SearchBar/field.tsx` is the Search content section: the placeholder input and the variant segmented control, preserving the previous variant labels.
- `Brand` content is now `{ showLogo, showSiteName, customText, customLogoUrl }`; `SearchBar` content is `{ placeholder, variant }`. The blocks keep only their content section plus the shared style fields.
- `BrandEditorRender` reads `puck.metadata` and passes it to `renderBrandBlock`. Explicit `siteName`/`logoUrl` props (the public server renderer) win over metadata, and the custom text/logo overrides win over both.
- `BrandServer` still reads Installation settings on the server; no editor module imports the database or fetches settings from the browser.
- The default header region uses `BRAND_DEFAULT_CONTENT`, and the Search bar defaults live in `SEARCH_BAR_DEFAULT_CONTENT`, so the editor controls and the render fallbacks cannot drift.
- There is intentionally no runtime compatibility layer: documents saved with the old flat props are converted by the issue 05 migration utility.
- Tests: `brand-block.test.tsx` covers the nested content shape, toggles, metadata-driven canvas preview, server-props precedence, custom overrides, style variables and defaults; `search-bar-block.test.tsx` covers the nested content shape, variants, style variables and config; `render-pipeline.test.tsx` and `default-regions.test.ts` were updated to the new shapes.
- Verification: `npx tsc --noEmit`, targeted `npx eslint`, `npm run test:run` (221 files / 1835 tests) and `npm run build` pass.
