"use client";

import { useMemo } from "react";
import { GridLayout, useContainerWidth, verticalCompactor } from "react-grid-layout";

import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";
import { useIsMobile } from "@/shared/hooks/use-mobile";

import {
  GRID_COLUMNS,
  GRID_MARGIN,
  GRID_ROW_HEIGHT,
  sortForSingleColumn,
  toGridItems,
} from "../../lib/grid-layout";
import { getWidgetDefinition } from "../../registry";

import { DashboardEmpty } from "./dashboard-empty";
import { WidgetCard } from "./widget-card";
import { WidgetLibraryTile } from "./widget-library";

interface WidgetGridProps {
  instances: DashboardWidgetInstance[];
  permittedDefinitions: WidgetDefinition[];
  onUpdate: (key: string, patch: Partial<DashboardWidgetInstance>) => void;
  onRemove: (key: string) => void;
  onAdd: (definitionId: string) => void;
  configContext: WidgetConfigContext;
}

interface ResolvedWidget {
  instance: DashboardWidgetInstance;
  definition: WidgetDefinition;
}

/**
 * Renders the positioned layout read-only: a twelve-column `react-grid-layout`
 * grid from `md` up, with vertical compaction so widgets float up and leave no
 * vertical hole. Below `md` the arrangement collapses to a single column ordered
 * by row then column. Adding, renaming, reconfiguring and removing a widget are
 * outside the layout model, so they stay available; moving and resizing arrive
 * in later tickets. When there is nothing to show, the grid is replaced by the
 * empty-dashboard prompt.
 */
export const WidgetGrid = ({
  instances,
  permittedDefinitions,
  onUpdate,
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

  if (widgets.length === 0) {
    return <DashboardEmpty definitions={permittedDefinitions} onSelect={onAdd} />;
  }

  const renderCard = ({ instance, definition }: ResolvedWidget) => (
    <WidgetCard
      definition={definition}
      instance={instance}
      configContext={configContext}
      onUpdate={(patch) => onUpdate(instance.key, patch)}
      onRemove={() => onRemove(instance.key)}
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
          dragConfig={{ enabled: false }}
          resizeConfig={{ enabled: false }}
          compactor={verticalCompactor}
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
