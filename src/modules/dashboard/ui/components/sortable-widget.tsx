"use client";

import { useSortable } from "@dnd-kit/react/sortable";

import { cn } from "@/shared/lib/utils";

import { widgetSizeClass } from "../../lib/widget-size";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "../../types";

import { WidgetCard } from "./widget-card";

interface SortableWidgetProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  index: number;
  configContext: WidgetConfigContext;
  onUpdate: (key: string, patch: Partial<DashboardWidgetInstance>) => void;
}

/**
 * An arrangeable Dashboard widget: a sortable grid cell wrapping the shared
 * card. The card's controls are always mounted; only the drag gesture is owned
 * by the sortable.
 */
export const SortableWidget = ({
  definition,
  instance,
  index,
  configContext,
  onUpdate,
}: SortableWidgetProps) => {
  const { ref, handleRef, isDragging } = useSortable({
    id: instance.key,
    index,
    group: "dashboard",
    type: "dashboard-widget",
  });

  return (
    <div
      ref={ref}
      className={cn(widgetSizeClass(instance, definition), isDragging && "opacity-60")}
    >
      <WidgetCard
        definition={definition}
        instance={instance}
        dragHandleRef={handleRef}
        configContext={configContext}
        onUpdate={(patch) => onUpdate(instance.key, patch)}
      />
    </div>
  );
};
