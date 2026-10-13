# 08: Widget title, description and active-filter chrome

**What to build:** Each card reads as a self-description. A Dashboard widget shows its title and the definition's one-line description, may be renamed in place per instance, and surfaces its active filters as chips. A Trend names itself after its metric, so an unrenamed instance reads "Contacts" rather than "Trend". The filter chips open the widget's config popover. This reverses the spec's former "Custom per-instance widget titles" exclusion.

**Blocked by:** 06 (the config popover the filter chips open). Builds on the card chrome from 01/03.

**Status:** ready-for-agent

- [ ] `DashboardWidgetInstance` gains an optional `title` override; the effective title resolves as instance override → definition default (config-aware) → definition static title.
- [ ] `WidgetDefinition` gains `resolveTitle?(context, config): string`; the Trend returns its metric's label so an unrenamed instance self-describes and follows metric changes.
- [ ] The card title is renamed in place and is keyboard-accessible: a focusable, hover/focus-revealed trigger that becomes an input on activation; Enter/blur saves, Escape reverts, an empty value reverts to the default.
- [ ] The effective title is used in the card's visible title and its arrange controls' `aria-label`s; the library keeps listing definitions by their default title.
- [ ] Every card shows the definition's static `description` as a single muted, clamped line under the title.
- [ ] `WidgetDefinition` gains `summarizeConfig?(config, context): WidgetFilterChip[]`; the card renders the chips under the description and shows none when the summary is empty.
- [ ] The Trend, drafts, and scheduled definitions implement `summarizeConfig`, returning chips only when the config differs from the widget's default (the Trend's form filter, once it narrows below every form).
- [ ] The Trend's chips summarize the form filter (count), with the selected names in a tooltip; its metric is not a chip (it is the title).
- [ ] The chips of a configurable widget open that widget's config popover.
- [ ] The layout round-trip persists the per-instance `title` (the `dashboard.saveLayout` document already stores opaque JSON).
- [ ] `spec.md` and `CONTEXT.md` reflect the shipped behaviour; no ADR.
- [ ] Coverage: unit tests for title resolution, `resolveTitle`, and each `summarizeConfig`; a `saveLayout` round-trip proving `title` persists per instance; manual acceptance for the rename and chip interactions.
