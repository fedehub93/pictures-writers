"use client";

import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";

import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";

import {
  mdColSpan,
  WIDGET_SIZE_UNITS,
  widgetSizeUnits,
} from "../../lib/widget-size";
import { resolveRowSpans } from "../../lib/widget-rows";
import { getWidgetDefinition } from "../../registry";

import { DashboardEmpty } from "./dashboard-empty";
import { SortableWidget } from "./sortable-widget";
import { WidgetLibraryTile } from "./widget-library";

interface WidgetGridProps {
  instances: DashboardWidgetInstance[];
  permittedDefinitions: WidgetDefinition[];
  onMove: (fromKey: string, toKey: string) => void;
  onUpdate: (key: string, patch: Partial<DashboardWidgetInstance>) => void;
  onRemove: (key: string) => void;
  onAdd: (definitionId: string) => void;
  configContext: WidgetConfigContext;
}

/**
 * Renders the layout's instances in the responsive dashboard grid. The
 * dashboard is always arrangeable, so every cell is sortable and the `+` tile
 * opens the widget library. When there is nothing to show, the grid is replaced
 * by the empty-dashboard prompt.
 */
export const WidgetGrid = ({
  instances,
  permittedDefinitions,
  onMove,
  onUpdate,
  onRemove,
  onAdd,
  configContext,
}: WidgetGridProps) => {
  const widgets = instances.flatMap((instance) => {
    const definition = getWidgetDefinition(instance.definitionId);
    return definition ? [{ instance, definition }] : [];
  });

  if (widgets.length === 0) {
    return <DashboardEmpty definitions={permittedDefinitions} onSelect={onAdd} />;
  }

  // Pack the widgets and the trailing add tile into the grid row by row,
  // stretching the last item of any partial row so no row shows a hole.
  const spans = resolveRowSpans([
    ...widgets.map(({ instance, definition }) =>
      widgetSizeUnits(instance, definition),
    ),
    WIDGET_SIZE_UNITS.small,
  ]);

  const onDragEnd = (event: DragEndEvent) => {
    if (event.canceled) return;

    const { source } = event.operation;
    if (!isSortable(source)) return;

    const { initialIndex, index } = source;
    if (initialIndex === index) return;

    const from = widgets[initialIndex]?.instance.key;
    const to = widgets[index]?.instance.key;
    if (!from || !to) return;

    onMove(from, to);
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
            columnSpan={spans[index]}
            configContext={configContext}
            onUpdate={onUpdate}
            onRemove={onRemove}
          />
        ))}

        <div className={mdColSpan(spans[widgets.length])}>
          <WidgetLibraryTile
            definitions={permittedDefinitions}
            onSelect={onAdd}
          />
        </div>
      </div>
    </DragDropProvider>
  );
};
