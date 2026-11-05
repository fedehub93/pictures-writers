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

- Follow the format of the existing records in `docs/adr/` (title, status, prose, considered options, consequences).
- This is a hard-to-reverse decision with genuine alternatives, so it meets the ADR threshold.

## Comments

Implemented in commit `79548ab6`.

- Added `docs/adr/0037-site-regions-as-versioned-entities.md` following the repo's existing ADR style (status, prose, considered options, consequences). The referenced `docs/agents/adr-format.md` does not exist; the format was taken from the neighbouring ADRs, and the ticket hint now points there.
- The record compares the chosen `SiteRegion` + `SiteRegionVersion` tables against reserved-slug `Page` rows and extending the real `Widget` model (the public site-widget builder, not the dashboard's code-defined registry), with `Settings` JSON as an additional alternative. It documents the Root + Version mechanics, the separate `site_layout` permissions, `revalidatePath("/", "layout")` plus the cache tag, and the brand-neutral code defaults for a fresh Installation.
- It references `CONTEXT.md` "Site layout" and `.scratch/site-regions/spec.md`.
- Code review corrected the fallback condition (never created, never published, or unpublished), the "at most one region" wording, the unpublish demotion to `CHANGED`, and the admin description (region cards, no dedicated history screen).
