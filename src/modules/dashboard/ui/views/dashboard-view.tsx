"use client";

import { useMemo } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { DatePickerWithRange } from "@/shared/components/date-range";
import { hasPermission } from "@/shared/lib/permissions";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
} from "@/shared/dashboard/types";
import { usePermissionKeys } from "@/shared/providers/authorization-provider";

import {
  addInstance,
  createInstanceKey,
  moveInstance,
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
import { useDebouncedSaveLayout } from "../hooks/use-debounced-save-layout";

export const DashboardView = () => {
  const trpc = useTRPC();
  const permissionKeys = usePermissionKeys();
  const { data } = useSuspenseQuery(trpc.dashboard.getLayout.queryOptions());
  const { data: metrics } = useSuspenseQuery(
    trpc.dashboard.getMetrics.queryOptions(),
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
  // metrics, for the Trend's picker).
  const configContext = useMemo<WidgetConfigContext>(
    () => ({ metrics }),
    [metrics],
  );

  // The dashboard is always arrangeable: the hook holds the working copy and
  // persists every change with a short debounce.
  const { instances, commit, saveState } = useDebouncedSaveLayout(savedLayout);

  const onUpdate = (key: string, patch: Partial<DashboardWidgetInstance>) =>
    commit(updateInstance(instances, key, patch));

  const onRemove = (key: string) => commit(removeInstance(instances, key));

  const onMove = (fromKey: string, toKey: string) =>
    commit(moveInstance(instances, fromKey, toKey));

  const onAdd = (definitionId: string) => {
    const definition = getWidgetDefinition(definitionId);
    commit(
      addInstance(
        instances,
        definitionId,
        createInstanceKey(definitionId),
        definition?.defaultConfig,
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
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {saveState === "saving"
            ? "Saving…"
            : saveState === "saved"
              ? "Saved"
              : null}
        </span>
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
        onMove={onMove}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onAdd={onAdd}
        configContext={configContext}
      />
    </div>
  );
};
