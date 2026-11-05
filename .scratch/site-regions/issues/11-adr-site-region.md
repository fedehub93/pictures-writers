---
Status: done
Type: task
---

# ADR: Site regions as first-class versioned entities

## Goal

Document why Site regions are stored in a dedicated table with root+version, instead of special pages or widgets.

## Acceptance criteria

- [x] New ADR at `docs/adr/0037-site-regions-as-versioned-entities.md`.
- [x] Explains the trade-off between:
  - dedicated `SiteRegion` table (chosen),
  - special `Page` rows with reserved slugs,
  - extending the `Widget` table.
- [x] Mentions versioning, permissions, revalidation and generic defaults.
- [x] References `CONTEXT.md` "Site layout" and `spec.md`.

## Hints

- Use the ADR format in `docs/agents/adr-format.md`.
- This is a hard-to-reverse decision with genuine alternatives, so it meets the ADR threshold.

## Comments

Implemented in commit `79548ab6`.

- Added `docs/adr/0037-site-regions-as-versioned-entities.md` following the repo's existing ADR style (status, prose, considered options, consequences). The referenced `docs/agents/adr-format.md` does not exist; the format was taken from the neighbouring ADRs.
- The record compares the chosen `SiteRegion` + `SiteRegionVersion` tables against reserved-slug `Page` rows, extending `Widget`, and storing regions in `Settings`. It documents the Root + Version mechanics, the separate `site_layout` permissions, `revalidatePath("/", "layout")` plus the cache tag, and the brand-neutral code defaults for a fresh Installation.
- It references `CONTEXT.md` "Site layout" and `.scratch/site-regions/spec.md`.
