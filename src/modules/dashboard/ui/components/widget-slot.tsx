"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "../../types";

import { WidgetCard } from "./widget-card";
import { WidgetError, WidgetLoading } from "./widget-states";

interface WidgetSlotProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  editing?: boolean;
  dragHandleRef?: (element: Element | null) => void;
  onHide?: () => void;
  configContext?: WidgetConfigContext;
  onConfigure?: (config: Record<string, unknown>) => void;
}

/**
 * The shared loading/error boundary around a single widget's card. Both the
 * static and the sortable grid cells render through it, so a widget never
 * takes the dashboard down with it.
 */
export const WidgetSlot = ({
  definition,
  instance,
  editing,
  dragHandleRef,
  onHide,
  configContext,
  onConfigure,
}: WidgetSlotProps) => (
  <Suspense fallback={<WidgetLoading />}>
    <ErrorBoundary fallback={<WidgetError />}>
      <WidgetCard
        definition={definition}
        instance={instance}
        editing={editing}
        dragHandleRef={dragHandleRef}
        onHide={onHide}
        configContext={configContext}
        onConfigure={onConfigure}
      />
    </ErrorBoundary>
  </Suspense>
);
