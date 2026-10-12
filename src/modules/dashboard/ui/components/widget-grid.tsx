"use client";

import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";

import { WIDGET_SIZE_CLASS } from "../../lib/widget-size";
import { getWidgetDefinition } from "../../registry";
import { visibleDashboardWidgets } from "../../server/layout";
import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "../../types";

import { DashboardEmpty } from "./dashboard-empty";
import { SortableWidget } from "./sortable-widget";
import { WidgetLibraryTile } from "./widget-library";

interface WidgetGridProps {
  instances: DashboardWidgetInstance[];
  permittedDefinitions: WidgetDefinition[];
  onMove: (fromVisibleIndex: number, toVisibleIndex: number) => void;
  onUpdate: (key: string, patch: Partial<DashboardWidgetInstance>) => void;
  onAdd: (definitionId: string) => void;
  configContext: WidgetConfigContext;
}

/**
 * Renders the layout's visible instances in the responsive dashboard grid. The
 * dashboard is always arrangeable, so every cell is sortable and the `+` tile
 * opens the widget library. When nothing is visible, the grid is replaced by the
 * empty-dashboard prompt.
 */
export const WidgetGrid = ({
  instances,
  permittedDefinitions,
  onMove,
  onUpdate,
  onAdd,
  configContext,
}: WidgetGridProps) => {
  const widgets = visibleDashboardWidgets(instances).flatMap((instance) => {
    const definition = getWidgetDefinition(instance.definitionId);
    return definition ? [{ instance, definition }] : [];
  });

  if (widgets.length === 0) {
    return (
      <DashboardEmpty
        definitions={permittedDefinitions}
        onSelect={onAdd}
        variant={instances.length > 0 ? "all-hidden" : "empty"}
      />
    );
  }

  const onDragEnd = (event: DragEndEvent) => {
    if (event.canceled) return;

    const { source } = event.operation;
    if (!isSortable(source)) return;

    const { initialIndex, index } = source;
    if (initialIndex === index) return;

    onMove(initialIndex, index);
  };

  return (
    <DragDropProvider onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-8">
        {widgets.map(({ instance, definition }, index) => (
          <SortableWidget
            key={instance.key}
            definition={definition}
            instance={instance}
            index={index}
            configContext={configContext}
            onUpdate={onUpdate}
          />
        ))}

        <div className={WIDGET_SIZE_CLASS.small}>
          <WidgetLibraryTile
            definitions={permittedDefinitions}
            onSelect={onAdd}
          />
        </div>
      </div>
    </DragDropProvider>
  );
};
