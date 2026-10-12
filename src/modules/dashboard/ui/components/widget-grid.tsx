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

import { SortableWidget } from "./sortable-widget";
import { WidgetCard } from "./widget-card";
import { WidgetLibraryTile } from "./widget-library";

interface WidgetGridProps {
  instances: DashboardWidgetInstance[];
  editing: boolean;
  permittedDefinitions: WidgetDefinition[];
  onMove: (fromVisibleIndex: number, toVisibleIndex: number) => void;
  onHide: (key: string) => void;
  onAdd: (definitionId: string) => void;
  configContext: WidgetConfigContext;
  onConfigure: (key: string, config: Record<string, unknown>) => void;
}

/**
 * Renders the layout's visible instances in the responsive dashboard grid. In
 * edit mode every cell is a sortable and a `+` tile opens the widget library;
 * otherwise the cells are static.
 */
export const WidgetGrid = ({
  instances,
  editing,
  permittedDefinitions,
  onMove,
  onHide,
  onAdd,
  configContext,
  onConfigure,
}: WidgetGridProps) => {
  const widgets = visibleDashboardWidgets(instances).flatMap((instance) => {
    const definition = getWidgetDefinition(instance.definitionId);
    return definition ? [{ instance, definition }] : [];
  });

  if (widgets.length === 0 && !editing) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Nessun widget disponibile.
        </p>
      </div>
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

  const grid = (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-8">
      {widgets.map(({ instance, definition }, index) =>
        editing ? (
          <SortableWidget
            key={instance.key}
            definition={definition}
            instance={instance}
            index={index}
            onHide={onHide}
            configContext={configContext}
            onConfigure={onConfigure}
          />
        ) : (
          <div key={instance.key} className={WIDGET_SIZE_CLASS[definition.size]}>
            <WidgetCard definition={definition} instance={instance} />
          </div>
        ),
      )}

      {editing ? (
        <div className={WIDGET_SIZE_CLASS.small}>
          <WidgetLibraryTile
            definitions={permittedDefinitions}
            onSelect={onAdd}
          />
        </div>
      ) : null}
    </div>
  );

  return editing ? (
    <DragDropProvider onDragEnd={onDragEnd}>{grid}</DragDropProvider>
  ) : (
    grid
  );
};
