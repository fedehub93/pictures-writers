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
import {
  applyLayoutAction,
  canMoveInstance,
  type LayoutAction,
} from "../../lib/keyboard-layout";
import { getWidgetDefinition } from "../../registry";

import { DashboardEmpty } from "./dashboard-empty";
import { EDIT_MODE_DRAG_HANDLE, WidgetCard } from "./widget-card";

interface WidgetGridProps {
  instances: DashboardWidgetInstance[];
  permittedDefinitions: WidgetDefinition[];
  /** Whether the dashboard is in edit mode: grid, drag, and resize enabled. */
  editing: boolean;
  onUpdate: (key: string, patch: Partial<DashboardWidgetInstance>) => void;
  /**
   * Receives the whole arrangement after a completed move or resize, plus the
   * key of the widget that moved or resized (absent when unknown), so the
   * dashboard can announce the change.
   */
  onLayoutChange: (
    items: readonly GridPlacementItem[],
    changedKey?: string,
  ) => void;
  onRemove: (key: string) => void;
  onAdd: (definitionId: string) => void;
  configContext: WidgetConfigContext;
  /** The instance just added, highlighted briefly so the user can find it. */
  highlightedKey?: string | null;
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
 * controls are live. In edit mode the grid lines become visible, a drag handle
 * on each card moves it, and the default south-east corner handle resizes it —
 * both snapping to cells and compacting upward. The handle is styled by the
 * `react-grid-layout`/`react-resizable` stylesheets the admin layout imports,
 * so it appears on hover like every other RGL surface. Each widget is bounded
 * by the definition's `minW`/`minH` and `maxW`/`maxH`, which `toGridItems`
 * attaches to the item, so a resize never drops below the legibility floor or
 * above the ceiling. A completed move or resize is reported through
 * `onLayoutChange` for the dashboard to auto-save. Because `react-grid-layout`
 * has no keyboard move or resize, each card also mounts a keyboard layout menu
 * in edit mode; its action is applied to the instances and compacted here, so
 * the keyboard path saves exactly the layout a pointer gesture would. When
 * there is nothing to
 * show, the grid is replaced by the empty-dashboard prompt.
 */
export const WidgetGrid = ({
  instances,
  permittedDefinitions,
  editing,
  onUpdate,
  onLayoutChange,
  onRemove,
  onAdd,
  configContext,
  highlightedKey,
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

  // A keyboard layout action is applied to the instances, then the whole
  // arrangement is compacted exactly as a pointer move or resize would be, so
  // the keyboard path saves the same layout a drag would.
  const onLayoutAction = (key: string, action: LayoutAction) => {
    const instance = instances.find((entry) => entry.key === key);
    if (!instance) return;
    const definition = getWidgetDefinition(instance.definitionId);
    if (!definition) return;

    const next = applyLayoutAction(instances, key, definition, action);
    if (next === instances) return;

    const items = toGridItems(
      next,
      widgets.map((widget) => widget.definition),
    );

    onLayoutChange(verticalCompactor.compact(items, GRID_COLUMNS), key);
  };

  const renderCard = ({ instance, definition }: ResolvedWidget) => (
    <WidgetCard
      definition={definition}
      instance={instance}
      configContext={configContext}
      editing={editing}
      highlighted={instance.key === highlightedKey}
      onUpdate={(patch) => onUpdate(instance.key, patch)}
      onRemove={editing ? () => onRemove(instance.key) : undefined}
      onLayoutAction={
        editing
          ? (action) => onLayoutAction(instance.key, action)
          : undefined
      }
      canMoveUp={canMoveInstance(instances, instance.key, -1)}
      canMoveDown={canMoveInstance(instances, instance.key, 1)}
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
          resizeConfig={{ enabled: editing }}
          onDragStop={(layout, _oldItem, newItem) =>
            onLayoutChange(layout, newItem?.i)
          }
          onResizeStop={(layout, _oldItem, newItem) =>
            onLayoutChange(layout, newItem?.i)
          }
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
    </div>
  );
};
