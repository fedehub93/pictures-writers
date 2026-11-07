# Site region authoring: block contracts, responsive visibility and megamenu

## Goal

Finish the Site region authoring model so that a backoffice editor can rebuild the current production header — including the big menu — in Puck, hide or show a single block per viewport, and have the canvas show exactly what will be published.

## Background

The Site region entities, palettes, blocks and the shared field → variable → class pipeline already exist (ADR-0037, `.scratch/site-regions/`, `.scratch/puck-uniformization/`). What remains are contract-level problems: header blocks claim full width, the canvas injects a layout that production does not reproduce, Layout is not available outside containers, the NavbarBlock item model cannot express the production mega menu, and its editor has outgrown the 300px sidebar. Two defects also block any verification: the public header throws when a Top bar is present, and the region editor closes the admin sidebar as soon as it is opened.

## Decisions

- **ADR-0037** is unchanged: Site regions are versioned entities with per-region palettes, and the NavbarBlock menu is a typed JSON tree rather than Puck children.
- **ADR-0038**: Layout is available on almost every block and is edited on the viewport selected in the editor; `display: none` is the hiding mechanism; a block hidden at the current viewport stays in the canvas as an editor-only placeholder.
- The Header region stays **free-form**: no structured header block with fixed brand/nav/actions slots. Container, Flex and Grid remain available.
- `Link` and `NavbarBlock` become **intrinsic**: they stop claiming `width: 100%`, and alignment comes from the parent's `justify`. No `align` prop is added to either block.
- NavbarBlock `column` children gain optional `description` and `icon`; with either present the mega layout renders them as a two-column grid of cards. The model stays backward compatible.
- `mega` / `compact` remains one setting for the whole NavbarBlock, not per menu item.
- Navigation items move to a `SidebarDialog` two-pane editor; the Puck sidebar keeps the layout choice, an item count and the entry point.
- The Heading rich text gains the TipTap **link mark**, so a link can sit inside a sentence.
- `Dimension` keeps meaning "the box of the block". The mobile hamburger gets its own size control instead of being sized through width/height.

## Out of scope

- A structured header block with fixed slots.
- Per-item `mega`/`compact`.
- Badges inside Puck's Outline (no per-instance label API; a custom outline would be a separate effort).
- A migration for old NavbarBlock flat props: no production document contains them.
- The Iubenda script loading strategy and consent ordering (separate concern; the warning is pre-existing and unrelated to the header).
- Removing the legacy static navbar and footer components.

## Tickets

| # | Ticket | Depends on |
| - | ------ | ---------- |
| 01 | Unblock the region render | — |
| 02 | Intrinsic header blocks and a faithful canvas | — |
| 03 | Layout and responsive visibility on every block | 02 |
| 04 | Inline links in rich text | — |
| 05 | Mega menu item model | 02 |
| 06 | Navigation editing dialog | 05 |

## Verification

Manual acceptance happens against the Header region in the admin, published to a local site: the canvas and the public page must produce the same arrangement at all three viewports, hiding the CTA on mobile must leave the other two items distributed by the parent, and the mega menu must reproduce the production Risorse and Servizi panels.
