"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { usePermissionKeys } from "@/shared/providers/authorization-provider";
import { hasPermission } from "@/shared/lib/permissions";

import { WIDGET_SIZE_CLASS } from "../../lib/widget-size";
import {
  DEFAULT_DASHBOARD_INSTANCES,
  getWidgetDefinition,
  WIDGET_DEFINITIONS,
} from "../../registry";
import {
  computeDashboardLayout,
  visibleDashboardWidgets,
} from "../../server/layout";

import { WidgetCard } from "../components/widget-card";
import { WidgetError, WidgetLoading } from "../components/widget-states";

export const DashboardView = () => {
  const trpc = useTRPC();
  const permissionKeys = usePermissionKeys();
  const { data } = useSuspenseQuery(trpc.dashboard.getLayout.queryOptions());

  const layout = computeDashboardLayout({
    defaults: DEFAULT_DASHBOARD_INSTANCES,
    saved: data.widgets,
    definitions: WIDGET_DEFINITIONS,
    canRead: (permission) => hasPermission(permissionKeys, permission),
  });

  const widgets = visibleDashboardWidgets(layout).flatMap((instance) => {
    const definition = getWidgetDefinition(instance.definitionId);
    return definition ? [{ instance, definition }] : [];
  });

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 md:pt-4">
      <div className="flex flex-col items-center justify-between gap-y-4 sm:flex-row">
        <h1 className="text-3xl">Dashboard</h1>
      </div>

      {widgets.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Nessun widget disponibile.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-8">
          {widgets.map(({ instance, definition }) => (
            <div key={instance.key} className={WIDGET_SIZE_CLASS[definition.size]}>
              <Suspense fallback={<WidgetLoading />}>
                <ErrorBoundary fallback={<WidgetError />}>
                  <WidgetCard definition={definition} instance={instance} />
                </ErrorBoundary>
              </Suspense>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
