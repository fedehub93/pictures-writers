---
Status: ready-for-agent
Type: spec
---

# Puck editor polish: custom block fields, Top bar, and preview fixes

## Problem Statement

The Site region blocks introduced by the Site regions work and migrated by the `puck-uniformization` effort still feel like a second-class part of the Puck layer.

- Their simple props use native Puck text, textarea and radio fields, while every older block uses the project's custom accordion fields. The result is an editor with two visual languages, and controls that do not share the project's spacing, reset affordance or state styling.
- The Announcement bar is an announcement-specific block: it owns `text` and `link` props, hashes the message to decide whether a dismissed bar reappears, and forces a primary-coloured banner. The Header region needs a generic top strip that can hold arbitrary content, not a one-off announcement.
- The Brand block appears empty in the editor canvas because the database-free editor render never receives the Installation site name or logo. Its "show logo" and "show site name" controls therefore look broken, even though the public site renders correctly. The Copyright block has the same blind spot for the site name.
- The NavbarBlock defaults to the mega menu layout, and the custom editor header does not expose Puck's interactive preview mode, so an editor cannot open the mega menu panels while composing the header.
- The shared SegmentedControl overflows when its labels are long: the link field's "Apertura" control shows clipped "Stessa scheda" and "Nuova scheda" buttons.
- The link field is partly in Italian while the rest of the editor is in English.

From the maintainer's perspective, the block contracts are also inconsistent: some blocks keep their content props flat and some group them, so adding a block still means inventing a field layout. From the editor's perspective, the Header and Footer cannot be styled with the same confidence as pages because the controls and the preview are different.

## Solution

Bring the remaining Site region blocks onto one editor convention and fix the specific behaviours that make the editor feel unfinished.

- Rename the Announcement bar to **Top bar** and redefine it as a generic, full-width container with a Puck slot for arbitrary content, an optional dismissal, and the shared dimension and decoration fields.
- Give every Header and Footer block one custom accordion field for its content, controlling a nested `content` object. The only native Puck fields left in those blocks are slots and shared style fields. Link collections gain a shared inline editor so they live inside the same content section.
- Pass Installation settings into the editor through Puck metadata so the Brand and Copyright blocks preview the real site name and logo in the canvas, while the public site keeps using its server renderers.
- Default the NavbarBlock to the compact layout, and add a Preview control to the Site region editor header that switches Puck to interactive preview so hover-driven navigation panels can be inspected.
- Fix the SegmentedControl overflow at the root, use a Switch for the boolean "open in new tab" setting, and move every editor label to English.
- Provide a one-off migration utility for documents saved with the old flat block props.

## User Stories

1. As a backoffice editor, I want the Top bar block to accept arbitrary blocks in a slot, so that I can build a shipping notice, a language strip or a promotion without a block dedicated to announcements.
2. As a backoffice editor, I want to turn the Top bar dismissal on or off, so that a generic strip can be permanent or closable as needed.
3. As a backoffice editor, I want a dismissed Top bar to stay visible while I am editing, so that I can always select and change it.
4. As a visitor, I want a dismissed Top bar to stay hidden on later visits, so that closing it is respected.
5. As a backoffice editor, I want the Top bar to default to a neutral full-width strip without a forced background, so that it does not look like an announcement before I style it.
6. As a backoffice editor, I want every Header and Footer block to open one recognisable content section in the properties panel, so that I do not have to hunt through native-looking fields.
7. As a backoffice editor, I want the Brand content, including the logo and site-name toggles and the custom overrides, in one Brand section, so that the block reads as one thing.
8. As a backoffice editor, I want the Brand block to show the real site name and logo in the canvas, so that toggling the logo or the site name has a visible effect while I design.
9. As a backoffice editor, I want the Copyright block to show the real site name in the canvas, so that the footer line previews what visitors will see.
10. As a backoffice editor, I want the Search bar placeholder and variant in one Search section, so that I can configure the control without native radio buttons.
11. As a backoffice editor, I want the Navbar layout and menu tree in one Navigation section, so that the layout choice sits next to the menu it affects.
12. As a backoffice editor, I want a new NavbarBlock to start in the compact layout, so that the simpler menu is the default and the mega menu is an explicit choice.
13. As a backoffice editor, I want a Preview control in the Site region editor, so that I can open hover-driven navigation panels and check the header without leaving the editor.
14. As a backoffice editor, I want Preview to leave the properties panel and saving untouched, so that I can switch back and keep working without losing changes.
15. As a backoffice editor, I want the Link list title and its links in one Link list section, so that the whole footer column is configured in one place.
16. As a backoffice editor, I want the Copyright year, extra text and links in one Copyright section, so that the whole line is configured in one place.
17. As a backoffice editor, I want link labels and options in English, so that the editor speaks one language.
18. As a backoffice editor, I want the "open in new tab" choice to be a clear switch instead of two clipped buttons, so that the setting is readable at a glance.
19. As a backoffice editor, I want long segmented labels to fit inside the properties panel, so that no control clips its text.
20. As a visitor, I want the Top bar to render only when it has content, so that an empty strip does not leave a gap.
21. As a visitor, I want the Top bar to keep its content and links working exactly like other blocks, so that nested links resolve as usual.
22. As a visitor, I want the Header and Footer to look and behave the same as before this work apart from the Top bar, so that the change is not a redesign.
23. As a maintainer, I want one custom content field per Header/Footer block, so that adding a block means choosing a content shape rather than mixing native and custom controls.
24. As a maintainer, I want the block content shapes to be nested consistently, so that the render, the UI and the saved document agree on one structure.
25. As a maintainer, I want the shared links editor to be reused by Link list and Copyright, so that link editing behaves the same in both.
26. As a maintainer, I want a pure, testable migration transform for the old flat shapes, so that existing development documents can be converted without hand editing.
27. As a maintainer, I want the Top bar rename to leave no dead Announcement bar code or palette entries, so that the registry reflects the product.
28. As a maintainer, I want no Prisma schema, tRPC procedure or Site region versioning changes, so that this work is confined to the Puck layer and the editor.
29. As a maintainer, I want the existing block, palette and render-pipeline tests updated rather than duplicated, so that the suite keeps protecting the same seams.
30. As a maintainer, I want type checking, linting, the test suite and the production build to stay green, so that the polish does not regress the editor or the public site.

## Implementation Decisions

- **Top bar replaces the Announcement bar.** The block key becomes `TopBar`; the old `AnnouncementBar` key, its `text` and `link` props, its text hash and its primary-coloured defaults are removed. The dismissal storage key is scoped by block id only.
- **Top bar shape.** The block is a generic container, not an announcement:
  - `content` is a Puck slot for arbitrary blocks; an empty slot renders nothing on the public site and shows a drop zone in the editor.
  - `settings.dismissible` is a boolean controlled by a custom Top bar section; the close button is runtime-only and is hidden inside the canvas.
  - `dimension` and `decoration` remain the shared responsive fields. The default is full width with sensible horizontal and vertical padding and no background, so the strip is neutral until styled.
  - The slot is the only native field besides the shared style fields; `settings` uses the same custom accordion convention as the other blocks.
- **One content field per block.** Each Header/Footer block exposes exactly one custom accordion field for its content, controlling a nested `content` object. Shared style fields stay separate. The resulting shapes are:
  - Brand: `content` with `showLogo`, `showSiteName`, `customText`, `customLogoUrl`.
  - Search bar: `content` with `placeholder`, `variant`.
  - NavbarBlock: `content` with `layout`, `items`.
  - Link list: `content` with `title`, `links`.
  - Copyright: `content` with `showYear`, `extraText`, `links`.
  - Top bar: `content` slot plus `settings.dismissible`.
- **Shared controls.** Controllers inside those custom fields reuse the project's existing editor controls (property headers with reset, text inputs, selects, segmented controls, colour inputs and the link editor) and a shared inline links editor for Link list and Copyright. The Navbar content field reuses the existing structured menu editor.
- **Installation settings in the canvas.** The editor shell accepts Puck metadata. The Site region editor page reads Installation settings and passes the site name and logo URL as metadata. The pure Brand and Copyright renders use that metadata as a fallback while the public renderers keep reading settings server-side. No block fetches settings from the browser.
- **Navbar default.** New NavbarBlock instances default to `compact`; `mega` remains available and existing saved documents keep whichever layout they already store.
- **Interactive preview.** The Site region editor header gains a Preview control that toggles Puck's `previewMode` between `edit` and `interactive`. It is exposed only by the Site region editor for now, so pages keep their current editing experience. The properties panel and saving continue to work in preview.
- **Control fixes.** The SegmentedControl is made text-safe at the root: small type, tighter horizontal padding and truncation, so long labels fit in the narrow properties panel. The boolean "open in new tab" setting uses a Switch with an English label instead of a two-option segmented control.
- **Language.** All editor labels in the touched fields and blocks are English, including the link field's type, opening, destination and empty-label copy.
- **Data and compatibility.** There is no runtime compatibility layer. A one-off migration utility converts existing Site region documents from the old flat block props to the nested `content` shapes for Brand, Search bar, NavbarBlock, Link list and Copyright. The Top bar is not migrated because its concept changed: an Announcement bar document is recreated in the editor. The utility is idempotent and runs outside the request path.
- **No backend change.** There is no Prisma schema change, no tRPC procedure change, no Site region versioning or publication change, and no link-resolution change. ADR-0037 remains untouched.
- **No new ADR.** The work applies existing editor conventions and fixes reversible UI behaviour; it does not introduce a new architectural trade-off.

## Testing Decisions

A good test asserts behaviour an editor or visitor can observe: which blocks a palette offers, the markup and style variables a block emits, the resolved link behaviour, what the canvas previews, and what the migration transform produces. It does not assert file locations, component identities or the internal shape of the field registry.

- **Seam: rendered block output.** Extend the existing per-block UI and server-render tests. Cover the Top bar with content, with an empty slot, with dismissal on and off, and with the shared dimension/decoration variables. Update the Brand, Search bar, NavbarBlock, Link list and Copyright tests to the nested content shapes while keeping the existing settings, link-resolution and style-variable assertions.
- **Seam: editor and public render parity.** Keep the existing render-pipeline comparison for client-safe shared blocks and extend it to the migrated blocks, so the editor canvas and the public `<Render>` cannot drift.
- **Seam: region palettes.** Keep the existing editor and public palette tests, updated for the Top bar rename, so a header-only block cannot leak into the footer or the page palette.
- **Seam: Installation settings preview.** Add a test that the Brand and Copyright blocks render the metadata-supplied site name and logo when no server props are present, and that real server props still win.
- **Seam: migration transform.** Test the pure document transform with representative old documents: already-migrated documents are left unchanged, each old flat shape becomes the matching nested content shape, and unknown or malformed component data is preserved or skipped without throwing.
- **Seam: preview control.** Keep the preview toggle logic in a small pure helper or a presentational header component so the next mode and the visible label can be tested without mounting Puck.
- **Prior art.** The Puck block UI tests, the render-pipeline test, the region palette tests, the site-region header action tests and the Site region server tests. The project already uses Vitest with `renderToStaticMarkup` and a dedicated PostgreSQL test database; no new harness is needed.
- **Not tested.** No browser or end-to-end test and no visual regression test: the overflow fix and the interactive preview are verified manually in development. There is no production migration test because this work is not deployed to production.
- **Verification.** Type checking, targeted linting, the full Vitest suite and the production build must pass.

## Out of Scope

- A Preview control for the page editor. The Site region editor is the only consumer for now.
- Moving the Brand logo onto the media-library image field.
- Text transform support in the Typography field.
- Changes to the NavbarBlock menu model, its desktop/mobile projections or its link resolution.
- Promoting Brand, Top bar, NavbarBlock or Link list to the page palette.
- New Site region keys or new public layout areas.
- A visual redesign of the public Header or Footer; the work preserves the current look apart from the generic Top bar defaults.
- Runtime backward compatibility for saved Puck documents.
- Multi-tenant columns or Installation provisioning.
- A new ADR.

## Further Notes

- Canonical vocabulary: `CONTEXT.md` → "Site layout". The glossary's "Announcement bar" entry has already been replaced by **Top bar**.
- Governing decision: ADR-0037, "Site regions as first-class versioned entities". This work respects its per-region palettes, typed NavbarBlock tree and server-side link resolution.
- Predecessor: `.scratch/puck-uniformization/` migrated the blocks onto the shared style fields and consolidated the render pipeline. This spec supersedes that spec's flat field shapes for the Header and Footer blocks.
- The Site regions feature has not been deployed to production, so the only data affected is development data.
- The previous spec's "no compatibility layer" position still holds: the migration utility is a one-off developer tool, not a runtime fallback.
