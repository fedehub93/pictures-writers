# 08: Widget title, description and active-filter chrome

**What to build:** Each card reads as a self-description. A Dashboard widget shows its title and the definition's one-line description, may be renamed in place per instance, and surfaces its active filters as chips. A Trend names itself after its metric, so an unrenamed instance reads "Contacts" rather than "Trend". The filter chips open the widget's config popover. This reverses the spec's former "Custom per-instance widget titles" exclusion.

**Blocked by:** 06 (the config popover the filter chips open). Builds on the card chrome from 01/03.

**Status:** ready-for-human (code complete; browser rename/chip interaction pending)

- [x] `DashboardWidgetInstance` gains an optional `title` override; the effective title resolves as instance override → definition default (config-aware) → definition static title.
- [x] `WidgetDefinition` gains `resolveTitle?(context, config): string`; the Trend returns its metric's label so an unrenamed instance self-describes and follows metric changes.
- [x] The card title is renamed in place and is keyboard-accessible: a focusable, hover/focus-revealed trigger that becomes an input on activation; Enter/blur saves, Escape reverts, an empty value reverts to the default.
- [x] The effective title is used in the card's visible title and its arrange controls' `aria-label`s; the library keeps listing definitions by their default title.
- [x] Every card shows the definition's static `description` as a single muted, clamped line under the title.
- [x] `WidgetDefinition` gains `summarizeConfig?(config, context): WidgetFilterChip[]`; the card renders the chips next to the title, always showing the selection in effect (even at its default).
- [x] The Trend, drafts, and scheduled definitions implement `summarizeConfig`, returning the selection in effect — the Trend's form filter reads "All forms" until narrowed.
- [x] The Trend's chips summarize the form filter (count), with the selected names in a tooltip; its metric is not a chip (it is the title).
- [x] The chips of a configurable widget open that widget's config popover.
- [x] The layout round-trip persists the per-instance `title` (the `dashboard.saveLayout` document already stores opaque JSON).
- [x] `spec.md` and `CONTEXT.md` reflect the shipped behaviour; no ADR.
- [ ] Coverage: unit tests for title resolution, `resolveTitle`, and each `summarizeConfig`; a `saveLayout` round-trip proving `title` persists per instance; manual acceptance for the rename and chip interactions.

## Comments

Delivered:

- `src/shared/dashboard/types.ts` — `DashboardWidgetInstance.title` override, `WidgetFilterChip`, `WidgetDefinition.resolveTitle`/`summarizeConfig`, and `WIDGET_TITLE_MAX_LENGTH` (one cap shared by the input and the server schema).
- `src/modules/dashboard/lib/widget-title.ts` — pure `resolveWidgetTitle(definition, instance, context)`: trimmed override → config-derived default → static title.
- `src/shared/dashboard/config.ts` — `configStringValues` moved here (with `summarizeMultiselect`, the shared "differs from default → one chip with option labels" helper), so the blog/scheduler modules read their own config via the contract, never via the dashboard.
- `src/modules/dashboard/ui/components/widget-title.tsx` — the title as a focusable button that becomes an input (Enter/blur save, Escape revert, empty clears); a hover/focus pencil affordance.
- `src/modules/dashboard/ui/components/widget-filter-chips.tsx` — chips under the description, with a tooltip; on a configurable widget each chip opens the config popover.
- `src/modules/dashboard/ui/components/widget-card.tsx` — renders the title, description and chips; builds the effective title from the context (empty context fallback so an override is honoured even with no metrics/forms); passes the effective title to the arrange controls' `aria-label`s.
- `src/modules/dashboard/ui/components/config-popover.tsx` — controllable `open`/`onOpenChange` and a `label`, so a chip opens the same popover and it names the renamed instance.
- `src/modules/dashboard/registry.ts` — the Trend's `resolveTitle` (metric label) and `summarizeConfig` (form subset: count + names in a tooltip, or "All forms"; the metric is never a chip).
- `blog/posts/widgets/index.ts` + `scheduler/widgets/index.ts` — `summarizeConfig` via the shared helper.
- `src/modules/dashboard/server/procedures.ts` — `widgetInstanceSchema` accepts the optional `title`, so `saveLayout` round-trips it.
- Coverage: `lib/__tests__/widget-title.test.ts` (5), `shared/dashboard/__tests__/config.test.ts` (5), `__tests__/registry.test.ts` (+4 for titles/filter summaries), `server/__tests__/procedures.test.ts` (title in the round-trip).
- Verified: full suite (121 files, 949 tests) green, `npx tsc --noEmit` clean, scoped eslint clean, `npm run build` green.

Notes:

- The reviews prompted two fixes: the `title` override now wins even when the card has no config context, and the shared `summarizeMultiselect` removed the duplicated `sameSet`/label logic from the two operational modules. The `spec.md` contract list and the "narrows" wording were corrected to "differs from the widget's default", matching the agreed decision.
- Browser acceptance of the rename (click → edit, Escape/empty) and of the chip→popover interaction is the one step left to a human.
- Follow-up after a first look: the arrange controls now reserve their own space (no overlap with the title); the title hugs its text, the rename input is capped, and the hover affordance is a dotted underline; the filter chips moved next to the title and are **always shown** (a chip at its default too, e.g. "All forms", "Draft, Changed") rather than only when the config narrows.
