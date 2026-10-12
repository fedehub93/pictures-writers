"use client";

import { useMemo, useState } from "react";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { DatePickerWithRange } from "@/shared/components/date-range";
import { hasPermission } from "@/shared/lib/permissions";
import { usePermissionKeys } from "@/shared/providers/authorization-provider";
import { Button } from "@/shared/ui/button";

import {
  addInstance,
  configureInstance,
  createInstanceKey,
  hideInstance,
  moveInstance,
} from "../../lib/edit-layout";
import { isAnalyticsInstanceRenderable } from "../../lib/metric-selection";
import {
  DEFAULT_DASHBOARD_INSTANCES,
  getWidgetDefinition,
  isAnalyticsWidget,
  WIDGET_DEFINITIONS,
} from "../../registry";
import { computeDashboardLayout, visibleDashboardWidgets } from "../../server/layout";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
} from "../../types";

import { WidgetGrid } from "../components/widget-grid";

export const DashboardView = () => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const permissionKeys = usePermissionKeys();
  const { data } = useSuspenseQuery(trpc.dashboard.getLayout.queryOptions());
  const { data: metrics } = useSuspenseQuery(
    trpc.dashboard.getMetrics.queryOptions(),
  );

  const canRead = useMemo(
    () => (permission: string) => hasPermission(permissionKeys, permission),
    [permissionKeys],
  );

  const layout = useMemo(
    () =>
      computeDashboardLayout({
        defaults: DEFAULT_DASHBOARD_INSTANCES,
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

  // `draft` holds the pending changes; `editing` hides or shows the edit
  // chrome. Leaving with "Fine" keeps the draft, "Annulla" discards it.
  const [draft, setDraft] = useState<DashboardWidgetInstance[] | null>(null);
  const [editing, setEditing] = useState(false);

  const saveLayout = useMutation(
    trpc.dashboard.saveLayout.mutationOptions({
      onSuccess: (result) => {
        queryClient.setQueryData(trpc.dashboard.getLayout.queryKey(), {
          widgets: result.widgets,
        });
        setDraft(null);
        setEditing(false);
        toast.success("Dashboard aggiornata.");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const enterEditMode = () => {
    setDraft((current) => current ?? layout);
    setEditing(true);
  };

  const leaveEditMode = () => setEditing(false);

  const cancelEditing = () => {
    setDraft(null);
    setEditing(false);
  };

  const save = () => {
    if (!draft) return;
    saveLayout.mutate({ widgets: draft });
  };

  const updateDraft = (
    change: (current: DashboardWidgetInstance[]) => DashboardWidgetInstance[],
  ) => setDraft((current) => (current ? change(current) : current));

  const onHide = (key: string) =>
    updateDraft((current) => hideInstance(current, key));

  const onMove = (from: number, to: number) =>
    updateDraft((current) => moveInstance(current, from, to));

  const onAdd = (definitionId: string) => {
    const definition = getWidgetDefinition(definitionId);
    updateDraft((current) =>
      addInstance(
        current,
        definitionId,
        createInstanceKey(definitionId),
        definition?.defaultConfig,
      ),
    );
  };

  const onConfigure = (key: string, config: Record<string, unknown>) =>
    updateDraft((current) => configureInstance(current, key, config));

  const instances = editing && draft ? draft : layout;

  // An analytics instance is rendered only when the user can read a metric for
  // it; otherwise the Trend has nothing to show and is left out.
  const renderableInstances = instances.filter((instance) => {
    const definition = getWidgetDefinition(instance.definitionId);
    if (!definition || !isAnalyticsWidget(definition)) return true;
    return isAnalyticsInstanceRenderable(instance.config, metrics);
  });

  const hasAnalytics = visibleDashboardWidgets(renderableInstances).some(
    (instance) => {
      const definition = getWidgetDefinition(instance.definitionId);
      return definition ? isAnalyticsWidget(definition) : false;
    },
  );

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 md:pt-4">
      <div className="flex flex-col items-center justify-between gap-y-4 sm:flex-row">
        <h1 className="text-3xl">Dashboard</h1>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={cancelEditing}
                disabled={saveLayout.isPending}
              >
                Annulla
              </Button>
              <Button
                type="button"
                onClick={save}
                disabled={saveLayout.isPending}
              >
                {saveLayout.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : null}
                Salva
              </Button>
            </>
          ) : draft ? (
            <span className="text-sm text-muted-foreground">
              Modifiche non salvate
            </span>
          ) : null}
          <Button
            type="button"
            variant={editing ? "outline" : "default"}
            onClick={editing ? leaveEditMode : enterEditMode}
          >
            {editing ? null : <Pencil />}
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
        editing={editing}
        permittedDefinitions={permittedDefinitions}
        onMove={onMove}
        onHide={onHide}
        onAdd={onAdd}
        configContext={configContext}
        onConfigure={onConfigure}
      />
    </div>
  );
};
