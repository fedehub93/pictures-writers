"use client";

import { useSortable } from "@dnd-kit/react/sortable";

import { cn } from "@/shared/lib/utils";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import { mdColSpan } from "../../lib/widget-size";

import { WidgetCard } from "./widget-card";

interface SortableWidgetProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  index: number;
  /** The grid columns this cell occupies, resolved by the row packer. */
  columnSpan: number;
  configContext: WidgetConfigContext;
  onUpdate: (key: string, patch: Partial<DashboardWidgetInstance>) => void;
  onRemove: (key: string) => void;
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
  columnSpan,
  configContext,
  onUpdate,
  onRemove,
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
      className={cn(mdColSpan(columnSpan), isDragging && "opacity-60")}
    >
      <WidgetCard
        definition={definition}
        instance={instance}
        dragHandleRef={handleRef}
        configContext={configContext}
        onUpdate={(patch) => onUpdate(instance.key, patch)}
        onRemove={() => onRemove(instance.key)}
      />
    </div>
  );
};
