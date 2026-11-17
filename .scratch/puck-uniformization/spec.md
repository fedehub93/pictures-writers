---
Status: ready-for-agent
Type: spec
---

# Uniformize the Site region Puck blocks with the existing Puck conventions

## Problem Statement

The Site region feature (Header region and Footer region) introduced Puck blocks — Text, LinkList, Copyright, Brand, Announcement bar, SearchBar, NavbarBlock — that do not follow the conventions the pre-existing Puck layer already established. The consequence is a Puck layer with three ways of doing the same thing:

- Some blocks expose typed style fields (Dimension, Typography, Decoration, Layout) and render responsive CSS custom properties through the shared `puck-*` classes. The new blocks mostly do not: Text exposes hand-rolled alignment and colour selects that apply inline CSS, so it is not responsive; LinkList, Copyright and Brand hard-code typography in Tailwind classes; Announcement bar exposes two colour selects instead of the shared decoration and typography fields; SearchBar and NavbarBlock expose no spacing controls at all.
- The public render path and the editor config declare the same block render in different ways: some blocks are copied into the public render config, some are reused by reference, and some are spread with a server renderer override. The copies are identical today, but nothing prevents them from drifting, and a fix applied to the editor render does not automatically reach the public site.
- There are two editor configs carrying duplicate component registries and duplicate document types. One of them is no longer used at runtime and is kept in sync by hand.
- Block prop types live inline in some blocks and in a dedicated types module in others; the region palette modules are spread across the Puck root rather than grouped; and the editor sidebar falls back to a generic square icon for the header-only blocks.

From the maintainer's perspective this is a correctness and maintenance problem: the editor canvas and the public Site region can render different markup for the same Puck document, and adding a block requires remembering several registries and palette tuples. From the backoffice editor's perspective it is a capability problem: the new blocks cannot be styled with the same responsive controls as the older ones.

No data change is involved: the Site region work has not been deployed to production, so no published Page or SiteRegionVersion contains the old Text or Announcement bar props.

## Solution

Bring every Site region block onto the existing Puck conventions and make the conventions single-sourced:

- Every block that presents text, spacing or surface uses the shared typed style fields and emits responsive CSS custom properties through the shared `puck-*` classes, instead of hand-rolled selects, inline styles or hard-coded typography.
- Each block exposes one pure render implementation. The editor config and the public render config both consume that implementation; only blocks that need Installation settings keep a separate server renderer for the public site.
- The editor config becomes the single component registry and document-type source, and is genuinely light: it holds registries, types and the page palette, not the editor shell. The Puck editor shell moves to its own module.
- The page palette, the Header region palette, the Footer region palette and the editor categories derive from one definition, so a block cannot appear in an editor palette but disappear from the corresponding public render palette.
- Block prop types live in each block's types module; region configuration modules are grouped together; header-only blocks get proper editor icons and labels.
- The current visual appearance of the new blocks is preserved through sensible defaults, so the refactor does not redesign the Header or Footer.

The public layout already resolves only the public render configs, so consolidating the editor configs does not change what the home page ships.

## User Stories

1. As a backoffice editor, I want the Text block to expose the same typography and dimension controls as Heading, so that I can size, align and colour a paragraph responsively instead of using fixed selects.
2. As a backoffice editor, I want the Text block's alignment and colour to survive tablet and mobile breakpoints, so that a paragraph designed on desktop still reads well on a phone.
3. As a backoffice editor, I want the LinkList block to expose typography and dimension controls, so that footer link columns can match the rest of the Site region instead of being locked to hard-coded sizes.
4. As a backoffice editor, I want the Copyright block to expose typography and dimension controls, so that the copyright line can be sized and spaced like the surrounding footer.
5. As a backoffice editor, I want the Brand block to expose typography and dimension controls, so that the site name and logo area can be adjusted without editing code.
6. As a backoffice editor, I want the Announcement bar's background to come from the shared decoration field and its text from the shared typography field, so that the banner uses the same colour and spacing vocabulary as every other block.
7. As a backoffice editor, I want the Announcement bar to keep its primary-coloured default look, so that adding one does not require configuring colours first.
8. As a backoffice editor, I want the SearchBar block to expose margin and padding controls, so that I can position it in the Header region without wrapping it in extra layout blocks.
9. As a backoffice editor, I want the SearchBar block to expose background, border and radius controls, so that it can sit on a coloured header surface.
10. As a backoffice editor, I want the NavbarBlock to expose margin, padding, background, border and radius controls, so that the navigation can be spaced and surfaced like the rest of the Header region.
11. As a backoffice editor, I want the header-only blocks to appear with meaningful icons and labels in the Pup editor sidebar, so that I can recognise Announcement bar, SearchBar and NavbarBlock at a glance.
12. As a backoffice editor, I want the Header editor to offer only header blocks and the Footer editor to offer only footer blocks, so that I cannot compose an invalid Site region.
13. As a backoffice editor, I want the editor categories to match the blocks actually available in that region, so that I never open an empty or misleading category.
14. As a backoffice editor, I want the migrated blocks to look the same as before the refactor, so that existing Header and Footer compositions do not need to be redone.
15. As a maintainer, I want one render implementation per block used by both the editor canvas and the public site, so that a fix or a markup change cannot land on only one side.
16. As a maintainer, I want the public render path to remain free of editor field modules, so that consolidating the render implementation does not grow the public bundle.
17. As a maintainer, I want a single editor config module that holds the component registry and the document types, so that adding a block does not require editing two registries.
18. As a maintainer, I want the editor shell separated from the config registry, so that modules that only need types or the component map do not pull in the full Puck editor.
19. As a maintainer, I want the page and Site region palettes derived from one definition, so that the editor palette and the public render palette cannot disagree.
20. As a maintainer, I want the editor categories derived from the same palette definition, so that category membership cannot drift from the palette.
21. As a maintainer, I want every block's props and UI-only props in its types module, so that block contracts are discoverable in one place.
22. As a maintainer, I want the region palette and region config modules grouped together, so that the Site layout code is easy to locate.
23. As a maintainer, I want the circular import between the page header actions and the editor config removed, so that the config split does not leave a latent module cycle.
24. As a maintainer, I want the unused colour-option helper removed once no block uses it, so that the Puck constants module reflects actual usage.
25. As a maintainer, I want no legacy-prop compatibility code for Text or Announcement bar, so that the refactor does not carry dead branches for documents that do not exist in production.
26. As a maintainer, I want tests that lock the editor and public render outputs together, so that the pipeline consolidation is protected against a future regression.
27. As a maintainer, I want the palette invariant tested per Site region, so that adding a block to one palette without the other fails CI.
28. As a maintainer, I want type checking, linting, the test suite and the production build to stay green, so that the refactor can land without a behaviour regression.
29. As a visitor, I want the Header and Footer to render the same content and layout as before the refactor, so that the change is invisible on the public site.
30. As a future contributor, I want adding a new Puck block to mean one block module, one registry entry and one palette tuple, so that the conventions are obvious from the codebase.

## Implementation Decisions

- **Style model.** Adopt the existing field → variable → class pipeline for the new blocks: typed Dimension, Typography and Decoration fields produce responsive CSS custom properties through the shared style-variable utilities, and the block UI applies the shared `puck-dim`, `puck-typo`, `puck-layout` and `puck-deco` classes. No block applies responsive style through ad-hoc selects or inline `textAlign`/`color` properties.
- **Field model per block.**
  - Text: `text` (plain multi-line text), `dimension`, `typography`. The hand-rolled `align` and `color` props are removed; alignment and colour come from typography.
  - LinkList: `title`, `links`, `dimension`, `typography`.
  - Copyright: `showYear`, `extraText`, `links`, `dimension`, `typography`.
  - Brand: `showLogo`, `showSiteName`, `customText`, `customLogoUrl`, `dimension`, `typography`.
  - Announcement bar: `text`, `link`, `dismissible`, `dimension`, `typography`, `decoration`. The `backgroundColor` and `textColor` props are removed; background comes from decoration and text colour from typography.
  - SearchBar: `placeholder`, `variant`, `dimension`, `decoration`. No typography field: the search control keeps its own internal type scale and a wrapper typography field would be partly ignored.
  - NavbarBlock: `items`, `layout`, `dimension`, `decoration`. No typography field for the same reason.
- **Preserved defaults.** The current look is preserved through default props rather than hard-coded classes:
  - Copyright defaults to the small footer type size.
  - Brand defaults to the current site-name size, weight and letter spacing, while the uppercase treatment remains a semantic class of the Brand block because Typography does not express text transform.
  - Announcement bar defaults to the primary background and primary-foreground text, small centred type and tight line height.
  - LinkList keeps a semibold title class and otherwise inherits the surrounding typography.
  - Text has no typographic default and inherits the surrounding typography.
  - SearchBar and NavbarBlock keep their current spacing defaults; the new fields are opt-in.
- **Render pipeline.** Each block exposes a pure render implementation that imports only its UI component and the shared style-variable utilities. The editor config and the public render config both consume it. Blocks that read Installation settings or resolve CMS links keep a server renderer used only by the public render config; the editor canvas continues to use the database-free render. The public render path must not import editor field modules.
- **Editor config split.** The config module becomes the canonical registry: component map, saved/hydrated document types and the page palette, with no Puck editor component and no editor CSS import. The Puck editor shell moves to its own module and consumes the registry. The obsolete duplicate config disappears, and modules that need only types import them as type-only imports, removing the latent import cycle between the page header actions and the editor config.
- **Single palette definition.** One region palette module owns the named block tuples for layout, brand, content, header-only and footer-only blocks. The Header editor palette, Footer editor palette, Header public render palette, Footer public render palette and editor categories all derive from those tuples. The page palette remains a separate explicit list because it is a different product surface.
- **Types and folders.** Every Puck block keeps its props and UI-only props in a block-local types module; blocks that currently declare props inline move them there while continuing to re-export the same public type names. Region palette and region config modules are grouped in a region-focused area of the Puck module. Block-local non-UI logic stays in a local lib area, and practical server renderers stay in a local server module.
- **Editor sidebar.** Announcement bar, SearchBar and NavbarBlock receive explicit sidebar icons and human labels instead of the generic square fallback.
- **No compatibility layer.** Text and Announcement bar lose their old props without a migration or a legacy fallback, because the Site region work has not reached production. No published Puck document in a production database contains those props.
- **No data or API changes.** There is no Prisma schema change, no tRPC procedure change and no SiteRegionVersion shape change. The versioning, publication, permissions, link resolution and announcement-dismissal behaviour documented in ADR-0037 are untouched.
- **No new ADR.** The refactor is reversible and is the application of existing conventions rather than a new architectural trade-off. It respects ADR-0037: the NavbarBlock menu remains a typed JSON tree, and Site region palettes remain per-region.
- **Cleanup.** Once Text and Announcement bar stop using the hand-rolled colour-option helper, that helper and its option type are removed if no other block uses them; the shared theme and palette colour constants stay because the colour inputs still use them.

## Testing Decisions

A good test here asserts the behaviour a user (editor or visitor) can observe: semantic markup, resolved and unresolved link behaviour, the CSS custom properties that carry responsive styles, and which blocks each palette exposes. It does not assert file locations, module identity or the internal shape of the registries.

- **Seam: rendered block markup.** Use the existing per-block UI tests that render a block UI to static markup and assert semantic markup plus the emitted CSS custom properties (`--ta-d`, `--fs-d`, `--fw-d`, `--ls-d`, `--tc-d`, `--bgc-d`, margin and padding variables). Update the Text tests so alignment and colour are asserted through typography variables, and the Announcement bar tests so background and colour are asserted through decoration and typography variables. Keep the existing link-resolution assertions for LinkList, Copyright and Announcement bar. Keep the existing server-renderer tests for Brand and Copyright, which read Installation settings from the test database. Keep the NavbarBlock and SearchBar structural tests and add spacing/surface assertions for the new dimension and decoration variables.
- **Seam: editor and public configs.** Extend the existing region config tests to assert, for each Site region, that the editor palette and the public render palette expose exactly the same block names, and that the editor categories are derived from the same definition. Add a parameterised test that renders the same props through the editor render and the public render for the client-safe shared blocks and asserts identical markup; this is the guard against the render pipeline drifting again. Blocks with a server renderer are excluded from that comparison because the editor canvas is deliberately database-free, and remain covered by their server-renderer tests and by the palette-membership assertions. The page palette assertions stay.
- **Prior art.** The block UI tests in the Puck test area, the region editor/render config tests, and the Site region server tests. The project already uses Vitest with `renderToStaticMarkup` and a dedicated PostgreSQL test database; no new fixture or harness is introduced.
- **Verification.** Type checking, linting, the full Vitest suite and the production build must pass. These are CI checks, not new test seams.
- **Not tested.** No database migration test (no schema change), no browser or end-to-end test (no new interaction), no legacy-document test (no compatibility layer), and no file-layout test.

## Out of Scope

- Data migration or backward compatibility for the removed Text and Announcement bar props.
- New blocks, new Site region keys, or new public layout areas.
- Removing the legacy static Navbar and Footer components; that cut-over remains a separate decision.
- Changing the NavbarBlock menu model, its typed JSON tree, its desktop and mobile projections, or its link resolution.
- Changing smart-link resolution, Site region versioning, publication, permissions or revalidation.
- A visual redesign of the Header or Footer; the refactor preserves the current look.
- Moving the Brand logo onto the media-library image field, and adding text transform to the typography field.
- Reworking the behaviour of the Puck editor shell; only its module boundary moves.
- Multi-tenant columns inside a single database.

## Further Notes

- Canonical vocabulary: `CONTEXT.md` → "Site layout" (Site region, Header region, Footer region, Announcement bar, Brand block, NavbarBlock, Link list, Site layout permission) and "Installation settings".
- Governing decision: ADR-0037, "Site regions as first-class versioned entities", including the per-region palettes and the typed NavbarBlock tree.
- Feature history: the Site region spec and tickets under `.scratch/site-regions/` record what shipped and why.
- The two editor configs date back to the custom Puck editor composition work; the older one stopped being used at runtime when the page builder switched to the custom editor shell, and has since been kept in sync by hand for its types. This refactor replaces that arrangement rather than preserving it.
- The public layout already imports only the public render configs, so this work does not change the home page bundle composition.
- The test database is required for the existing Brand and Copyright server-renderer tests; they continue to use it.
