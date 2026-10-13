"use client";

import { useMemo, type CSSProperties } from "react";
import { GridLayout, useContainerWidth, verticalCompactor } from "react-grid-layout";

import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";
import { useIsMobile } from "@/shared/hooks/use-mobile";

import type { GridPlacementItem } from "../../lib/edit-layout";
import {
  GRID_COLUMNS,
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  sortForSingleColumn,
  toGridItems,
} from "../../lib/grid-layout";
import { getWidgetDefinition } from "../../registry";

import { DashboardEmpty } from "./dashboard-empty";
import { EDIT_MODE_DRAG_HANDLE, WidgetCard } from "./widget-card";
import { WidgetLibraryTile } from "./widget-library";

interface WidgetGridProps {
  instances: DashboardWidgetInstance[];
  permittedDefinitions: WidgetDefinition[];
  /** Whether the dashboard is in edit mode: grid visible and drag enabled. */
  editing: boolean;
  onUpdate: (key: string, patch: Partial<DashboardWidgetInstance>) => void;
  onMove: (items: readonly GridPlacementItem[]) => void;
  onRemove: (key: string) => void;
  onAdd: (definitionId: string) => void;
  configContext: WidgetConfigContext;
}

interface ResolvedWidget {
  instance: DashboardWidgetInstance;
  definition: WidgetDefinition;
}

/**
 * Renders the positioned layout: a twelve-column `react-grid-layout` grid from
 * `md` up, with vertical compaction so widgets float up and leave no vertical
 * hole. Below `md` the arrangement collapses to a single column ordered by row
 * then column.
 *
 * Outside edit mode the grid is a clean read surface: no visible grid and no
 * spatial controls; only the widget bodies and the non-spatial rename/config
 * controls are live. In edit mode the grid lines become visible and a drag
 * handle on each card moves it, snapping to cells and compacting upward. A
 * completed move is reported through `onMove` for the dashboard to auto-save;
 * resizing arrives in a later ticket. When there is nothing to show, the grid
 * is replaced by the empty-dashboard prompt.
 */
export const WidgetGrid = ({
  instances,
  permittedDefinitions,
  editing,
  onUpdate,
  onMove,
  onRemove,
  onAdd,
  configContext,
}: WidgetGridProps) => {
  const isMobile = useIsMobile();
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });

  const widgets = useMemo<ResolvedWidget[]>(
    () =>
      instances.flatMap((instance) => {
        const definition = getWidgetDefinition(instance.definitionId);
        return definition ? [{ instance, definition }] : [];
      }),
    [instances],
  );

  const gridItems = useMemo(
    () => toGridItems(instances, widgets.map(({ definition }) => definition)),
    [instances, widgets],
  );

  // Below `md`, the two-dimensional arrangement reads top-to-bottom: order the
  // resolved widgets by row, then column.
  const singleColumnWidgets = useMemo(() => {
    const byKey = new Map(
      widgets.map((widget) => [widget.instance.key, widget]),
    );

    return sortForSingleColumn(instances).flatMap((instance) => {
      const widget = byKey.get(instance.key);
      return widget ? [widget] : [];
    });
  }, [instances, widgets]);

  // The visible grid: faint lines aligned to the cell pitch, drawn only while
  // editing. The pitch matches react-grid-layout's own column/row maths with a
  // zero container padding, so the lines sit on the cell boundaries. The line
  // colour is the theme's border token (`--color-border`), which the admin
  // theme resolves to a full oklch colour — not HSL channels.
  const columnWidth = Math.max(
    0,
    (width - GRID_MARGIN * (GRID_COLUMNS - 1)) / GRID_COLUMNS,
  );
  const gridLine = "var(--color-border) 1px, transparent 1px";
  const editingGridStyle: CSSProperties | undefined = editing
    ? {
        backgroundImage: `linear-gradient(to right, ${gridLine}), linear-gradient(to bottom, ${gridLine})`,
        backgroundSize: `${columnWidth + GRID_MARGIN}px ${GRID_ROW_HEIGHT + GRID_MARGIN}px`,
      }
    : undefined;

  if (widgets.length === 0) {
    return <DashboardEmpty definitions={permittedDefinitions} onSelect={onAdd} />;
  }

  const renderCard = ({ instance, definition }: ResolvedWidget) => (
    <WidgetCard
      definition={definition}
      instance={instance}
      configContext={configContext}
      editing={editing}
      onUpdate={(patch) => onUpdate(instance.key, patch)}
      onRemove={editing ? () => onRemove(instance.key) : undefined}
    />
  );

  return (
    <div ref={containerRef}>
      {!mounted ? null : isMobile ? (
        <div className="flex flex-col gap-4">
          {singleColumnWidgets.map((widget) => (
            <div key={widget.instance.key}>{renderCard(widget)}</div>
          ))}
        </div>
      ) : (
        <GridLayout
          width={width}
          layout={gridItems}
          gridConfig={{
            cols: GRID_COLUMNS,
            rowHeight: GRID_ROW_HEIGHT,
            margin: [GRID_MARGIN, GRID_MARGIN],
            containerPadding: [0, 0],
          }}
          dragConfig={{ enabled: editing, handle: `.${EDIT_MODE_DRAG_HANDLE}` }}
          resizeConfig={{ enabled: false }}
          onDragStop={(layout) => onMove(layout)}
          compactor={verticalCompactor}
          style={editingGridStyle}
        >
          {widgets.map((widget) => (
            <div key={widget.instance.key} className="h-full">
              {renderCard(widget)}
            </div>
          ))}
        </GridLayout>
      )}

      <div className="mt-4">
        <WidgetLibraryTile definitions={permittedDefinitions} onSelect={onAdd} />
      </div>
    </div>
  );
};
