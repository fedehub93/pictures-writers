# 06: Generic widget configuration and Trend metric picker

**What to build:** Widget configuration is a generic part of the widget contract, not a special case of the Trend. Any configurable widget exposes a schema; in edit mode its card shows a gear that opens a populated popover, and the chosen config is saved with the user's layout. The Trend is the first user: the gear lets the user pick which permitted metric the instance renders.

**Blocked by:** 03, 05

**Status:** resolved

- [x] The widget definition contract supports an optional config schema and default config.
- [x] In edit mode, a configurable card shows a gear that opens a popover generated from the widget's config schema.
- [x] The chosen config persists per instance in the user's layout override.
- [x] The Trend widget lets the user choose which permitted metric the instance renders.
- [x] Changing a Trend's metric affects only that instance and survives a reload.

## Comments

Delivered:

- `src/modules/dashboard/types.ts` — the config contract: `WidgetConfigSchema`, `WidgetConfigSelectField` (a discriminated `type: "select"` field so new field kinds can be added without touching callers), `WidgetConfigOption`, `WidgetConfigContext` (the metrics the user may read), and `WidgetConfigSchemaResolver`. `WidgetDefinition.configSchema` is now typed as the resolver instead of `unknown`; `defaultConfig` stays optional.
- `src/modules/dashboard/lib/config.ts` — pure helpers: `configFieldValue` (the stored value only while it is still an option, else the first option, so the popover never shows a stale/unpermitted choice) and `withConfigValue` (sets one field, preserving the rest).
- `src/modules/dashboard/lib/edit-layout.ts` — `configureInstance` mutates exactly the keyed instance's config; `addInstance` now seeds a freshly appended instance with the definition's optional `defaultConfig` and keeps a re-shown hidden instance's own config.
- `src/modules/dashboard/registry.ts` — the Trend declares a `configSchema` whose single `select` field (`metric`) is built from the permitted metrics, so the gear offers only what the user may read.
- `src/modules/dashboard/ui/components/config-popover.tsx` — the gear + shadcn `Popover`, generated from `configSchema`: `FieldGroup`/`Field`/`FieldLabel` with a shadcn `Select` per field. It reports the full updated config for the instance.
- `src/modules/dashboard/ui/` — `WidgetCard` renders the gear in edit chrome for a configurable definition; `onConfigure`/`configContext` are threaded through `WidgetGrid` → `SortableWidget` → `WidgetSlot`. `DashboardView` builds the context from the permitted metrics, wires `onConfigure` to `configureInstance`, and seeds library additions with `defaultConfig`.
- Persistence needed no procedure change: `dashboard.saveLayout` already stores per-instance `config`.
- Coverage: `lib/__tests__/config.test.ts` (6), `lib/__tests__/edit-layout.test.ts` gains `configureInstance` (2) and default/re-shown-config cases (2), `__tests__/registry.test.ts` (Trend picker generated from metrics + operational widgets have no schema), `server/__tests__/procedures.test.ts` (per-instance config round-trip where re-configuring one Trend leaves the other untouched).
- Verified: full suite green, `npx tsc --noEmit` clean, `npx eslint src/modules/dashboard` clean (one pre-existing warning on the legacy `subscriptions-widget.tsx`, removed by ticket 07).
