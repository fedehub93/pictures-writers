"use client";

import { useEffect, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, Pencil, Plus } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { DatePickerWithRange } from "@/shared/components/date-range";
import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";
import {
  SaveStatusIndicator,
  type SaveStatus,
} from "@/shared/components/save-status-indicator";
import { hasPermission } from "@/shared/lib/permissions";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  isAnalyticsWidget,
  type DashboardWidgetInstance,
  type WidgetConfigContext,
} from "@/shared/dashboard/types";
import { usePermissionKeys } from "@/shared/providers/authorization-provider";

import {
  addInstance,
  applyGridLayout,
  createInstanceKey,
  type GridPlacementItem,
  removeInstance,
  updateInstance,
} from "../../lib/edit-layout";
import { layoutChangeAnnouncement } from "../../lib/layout-announcement";
import { isAnalyticsInstanceRenderable } from "../../lib/metric-selection";
import { permittedLibraryDefinitions } from "../../lib/widget-library";
import { resolveWidgetTitle } from "../../lib/widget-title";
import {
  getWidgetDefinition,
  WIDGET_DEFINITIONS,
} from "../../registry";
import { computeDashboardLayout } from "../../server/layout";

import { WidgetGrid } from "../components/widget-grid";
import { WidgetLibrary } from "../components/widget-library";
import {
  type SaveState,
  useDebouncedSaveLayout,
} from "../hooks/use-debounced-save-layout";

const SAVE_STATE_STATUS: Record<SaveState, SaveStatus> = {
  idle: "no_change",
  saving: "saving",
  saved: "saved",
  error: "error",
};

/** How long a newly added widget stays highlighted. */
const HIGHLIGHT_MS = 2000;

export const DashboardView = () => {
  const trpc = useTRPC();
  const permissionKeys = usePermissionKeys();
  const { data } = useSuspenseQuery(trpc.dashboard.getLayout.queryOptions());
  const { data: metrics } = useSuspenseQuery(
    trpc.dashboard.getMetrics.queryOptions(),
  );
  const { data: forms } = useSuspenseQuery(
    trpc.dashboard.getFormOptions.queryOptions(),
  );

  const canRead = useMemo(
    () => (permission: string) => hasPermission(permissionKeys, permission),
    [permissionKeys],
  );

  // The saved layout filtered to the definitions that still exist and are
  // permitted. There is no registry default: no saved widgets means an empty
  // dashboard.
  const savedLayout = useMemo(
    () =>
      computeDashboardLayout({
        saved: data.widgets,
        definitions: WIDGET_DEFINITIONS,
        canRead,
      }),
    [data.widgets, canRead],
  );

  const permittedDefinitions = useMemo(
    () =>
      permittedLibraryDefinitions(WIDGET_DEFINITIONS, canRead, metrics.length),
    [canRead, metrics],
  );

  // Context a configurable widget's schema resolves against (the permitted
  // metrics and forms, for the Trend's pickers).
  const configContext = useMemo<WidgetConfigContext>(
    () => ({ metrics, forms }),
    [metrics, forms],
  );

  // The dashboard is always arrangeable: the hook holds the working copy and
  // persists every change with a short debounce.
  const { instances, commit, saveState } = useDebouncedSaveLayout(savedLayout);

  // Edit mode is a presentation state, not a commit boundary: entering it
  // reveals the grid and the spatial controls, and every move still auto-saves.
  const [editing, setEditing] = useState(false);

  // Whether the widget library is open, controlled here so a menu item can open
  // it without the library owning a trigger of its own.
  const [libraryOpen, setLibraryOpen] = useState(false);

  // The instance just added, so its card can flash and the user can find where
  // it landed. Cleared after a short beat.
  const [highlightedKey, setHighlightedKey] = useState<string | null>(null);

  // The most recent layout change, described for the `aria-live` region. The
  // sequence forces a fresh announcement when the same widget lands in the same
  // place twice, which an unchanged string would otherwise swallow.
  const [announcement, setAnnouncement] = useState<{
    text: string;
    seq: number;
  } | null>(null);

  useEffect(() => {
    if (!highlightedKey) return;
    const timer = setTimeout(() => setHighlightedKey(null), HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [highlightedKey]);

  const onUpdate = (key: string, patch: Partial<DashboardWidgetInstance>) =>
    commit(updateInstance(instances, key, patch));

  // A completed move or resize reports the whole arrangement; read it back into
  // the instances (a resize also drags neighbours through compaction) and
  // auto-save it. When the grid names the widget that changed, announce it to
  // assistive technology with its new position and size.
  const onLayoutChange = (
    items: readonly GridPlacementItem[],
    changedKey?: string,
  ) => {
    commit(applyGridLayout(instances, items));

    if (!changedKey) return;
    const item = items.find((entry) => entry.i === changedKey);
    const instance = instances.find((entry) => entry.key === changedKey);
    const definition = instance
      ? getWidgetDefinition(instance.definitionId)
      : undefined;
    if (!item || !instance || !definition) return;

    const text = layoutChangeAnnouncement(
      resolveWidgetTitle(definition, instance, configContext),
      item,
    );
    setAnnouncement((previous) => ({
      text,
      seq: (previous?.seq ?? 0) + 1,
    }));
  };

  const onRemove = (key: string) => commit(removeInstance(instances, key));

  const onAdd = (definitionId: string) => {
    const definition = getWidgetDefinition(definitionId);
    if (!definition) return;
    const key = createInstanceKey(definitionId);
    commit(
      addInstance(instances, definition, key, definition.defaultConfig),
    );
    setHighlightedKey(key);
  };

  // An analytics instance is rendered only when the user can read a metric for
  // it; otherwise the Trend has nothing to show and is left out.
  const renderableInstances = instances.filter((instance) => {
    const definition = getWidgetDefinition(instance.definitionId);
    if (!definition || !isAnalyticsWidget(definition)) return true;
    return isAnalyticsInstanceRenderable(instance.config, metrics);
  });

  const hasAnalytics = renderableInstances.some((instance) => {
    const definition = getWidgetDefinition(instance.definitionId);
    return definition ? isAnalyticsWidget(definition) : false;
  });

  return (
    // The bottom padding reserves room for the floating actions so the last
    // widget can scroll clear of them.
    <div className="flex flex-1 flex-col gap-4 p-4 pb-32 md:gap-8 md:p-8 md:pt-4 md:pb-32">
      <div
        aria-live="polite"
        role="status"
        className="sr-only"
      >
        {announcement ? (
          <span key={announcement.seq}>{announcement.text}</span>
        ) : null}
      </div>
      <div className="flex flex-col items-center justify-between gap-y-4 sm:flex-row">
        <h1 className="text-3xl">Dashboard</h1>
        <SaveStatusIndicator status={SAVE_STATE_STATUS[saveState]} />
      </div>

      <WidgetLibrary
        definitions={permittedDefinitions}
        onSelect={onAdd}
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
      />

      {hasAnalytics ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">
            Analytics
          </span>
          <DatePickerWithRange />
        </div>
      ) : null}

      <WidgetGrid
        instances={renderableInstances}
        permittedDefinitions={permittedDefinitions}
        editing={editing}
        onUpdate={onUpdate}
        onLayoutChange={onLayoutChange}
        onRemove={onRemove}
        onAdd={onAdd}
        configContext={configContext}
        highlightedKey={highlightedKey}
      />

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-3 md:bottom-8 md:right-8">
        <Button
          type="button"
          size="icon-lg"
          variant="secondary"
          aria-label={editing ? "Fine" : "Modifica"}
          aria-pressed={editing}
          className={cn(
            "rounded-full shadow-lg",
            editing && "ring-2 ring-ring ring-offset-2 ring-offset-background",
          )}
          onClick={() => setEditing((current) => !current)}
        >
          {editing ? <Check className="size-5" /> : <Pencil className="size-5" />}
        </Button>
        <Button
          type="button"
          size="icon-lg"
          variant="default"
          aria-label="Aggiungi widget"
          className="rounded-full shadow-lg"
          onClick={() => setLibraryOpen(true)}
        >
          <Plus className="size-5" />
        </Button>
      </div>
    </div>
  );
};

export const DashboardViewLoading = () => (
  <LoadingState
    title="Loading Dashboard"
    description="This may take a few seconds"
  />
);

export const DashboardViewError = () => (
  <ErrorState title="Error Dashboard" description="Something went wrong" />
);
