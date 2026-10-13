"use client";

import { useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { DatePickerWithRange } from "@/shared/components/date-range";
import {
  SaveStatusIndicator,
  type SaveStatus,
} from "@/shared/components/save-status-indicator";
import { hasPermission } from "@/shared/lib/permissions";
import { Button } from "@/shared/ui/button";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
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
import { isAnalyticsInstanceRenderable } from "../../lib/metric-selection";
import {
  getWidgetDefinition,
  isAnalyticsWidget,
  WIDGET_DEFINITIONS,
} from "../../registry";
import { computeDashboardLayout } from "../../server/layout";

import { WidgetGrid } from "../components/widget-grid";
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
      WIDGET_DEFINITIONS.filter((definition) => {
        const permitted =
          !definition.permission || canRead(definition.permission);
        if (!permitted) return false;
        // The Trend is offered only when the user can read at least one metric.
        return !isAnalyticsWidget(definition) || metrics.length > 0;
      }),
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

  const onUpdate = (key: string, patch: Partial<DashboardWidgetInstance>) =>
    commit(updateInstance(instances, key, patch));

  const onMove = (items: readonly GridPlacementItem[]) =>
    commit(applyGridLayout(instances, items));

  const onRemove = (key: string) => commit(removeInstance(instances, key));

  const onAdd = (definitionId: string) => {
    const definition = getWidgetDefinition(definitionId);
    if (!definition) return;
    commit(
      addInstance(
        instances,
        definition,
        createInstanceKey(definitionId),
        definition.defaultConfig,
      ),
    );
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
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 md:pt-4">
      <div className="flex flex-col items-center justify-between gap-y-4 sm:flex-row">
        <h1 className="text-3xl">Dashboard</h1>
        <div className="flex items-center gap-2">
          <SaveStatusIndicator status={SAVE_STATE_STATUS[saveState]} />
          <Button
            type="button"
            variant={editing ? "default" : "ghost"}
            onClick={() => setEditing((current) => !current)}
            aria-pressed={editing}
          >
            <Pencil />
            {editing ? "Fine" : "Modifica"}
          </Button>
        </div>
      </div>

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
        onMove={onMove}
        onRemove={onRemove}
        onAdd={onAdd}
        configContext={configContext}
      />
    </div>
  );
};
