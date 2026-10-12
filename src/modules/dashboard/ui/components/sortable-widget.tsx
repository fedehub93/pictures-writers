"use client";

import { useSortable } from "@dnd-kit/react/sortable";

import { cn } from "@/shared/lib/utils";

import { WIDGET_SIZE_CLASS } from "../../lib/widget-size";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "../../types";

import { WidgetSlot } from "./widget-slot";

interface SortableWidgetProps {
  definition: WidgetDefinition;
  instance: DashboardWidgetInstance;
  index: number;
  onHide: (key: string) => void;
  configContext: WidgetConfigContext;
  onConfigure: (key: string, config: Record<string, unknown>) => void;
}

/**
 * An editable Dashboard widget: a sortable grid cell wrapping the shared card.
 * Only rendered while editing, so the sortable hooks are never called outside
 * edit mode.
 */
export const SortableWidget = ({
  definition,
  instance,
  index,
  onHide,
  configContext,
  onConfigure,
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
      className={cn(
        WIDGET_SIZE_CLASS[definition.size],
        isDragging && "opacity-60",
      )}
    >
      <WidgetSlot
        definition={definition}
        instance={instance}
        editing
        dragHandleRef={handleRef}
        onHide={() => onHide(instance.key)}
        configContext={configContext}
        onConfigure={(config) => onConfigure(instance.key, config)}
      />
    </div>
  );
};
