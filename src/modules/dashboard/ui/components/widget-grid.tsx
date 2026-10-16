"use client";

import { useEffect, useMemo, useState } from "react";
import { GridLayout, useContainerWidth, verticalCompactor } from "react-grid-layout";
import { GridBackground } from "react-grid-layout/extras";

import type {
  DashboardWidgetInstance,
  WidgetConfigContext,
  WidgetDefinition,
} from "@/shared/dashboard/types";
import { useIsCoarsePointer } from "@/shared/hooks/use-coarse-pointer";
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
 * then column — a read-only rendering of the same canonical placement, so
 * shrinking the viewport never rewrites the layout and widening it shows the
 * arrangement unchanged. The collapsed view stacks full-width cards and
 * imposes no per-column minimum width, which is what used to push the old
 * fixed-column grid into horizontal scroll.
 *
 * Outside edit mode the grid is a clean read surface: no visible grid and no
 * spatial controls; only the widget bodies and the non-spatial rename/config
 * controls are live. In edit mode the grid lines become visible, a drag handle
 * on each card moves it, and the default south-east corner handle resizes it —
 * both snapping to cells and compacting upward. On a coarse pointer (touch)
 * the resize handle is unavailable and resizing cannot be triggered, since
 * imprecise touch resizing fights the user; dragging to reorder stays available
 * wherever the grid renders. The resize handle is styled by the
 * `react-grid-layout`/`react-resizable` stylesheets the admin layout imports,
 * so it appears on hover like every other RGL surface. Each widget is bounded
 * by the definition's `minW`/`minH` and `maxW`/`maxH`, which `toGridItems`
 * attaches to the item, so a resize never drops below the legibility floor or
 * above the ceiling. A completed move or resize is reported through
 * `onLayoutChange` for the dashboard to auto-save. Because `react-grid-layout`
 * has no keyboard move or resize, each card also mounts a keyboard layout menu
 * in edit mode; its action is applied to the instances and compacted here, so
 * the keyboard path saves exactly the layout a pointer gesture would — and,
 * since the menu does not depend on the grid's DOM, it still works at the
 * single-column width. When there is nothing to show, the grid is replaced by
 * the empty-dashboard prompt.
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
  const isCoarsePointer = useIsCoarsePointer();
  const { width, containerRef, mounted } = useContainerWidth({
    measureBeforeMount: true,
  });

  // The height the grid fills: the wrapper grows to the residual space of the
  // dashboard column (and past it when the widgets are taller), so the grid
  // background reaches the bottom of the viewport instead of stopping at the
  // last widget. Measured after mount to avoid a hydration mismatch.
  const [fillHeight, setFillHeight] = useState(0);

  // Whether a pointer resize is in progress. While it is, the grid's row cap is
  // lifted (see `maxRows`) so a widget can grow past the rows its neighbours
  // already occupy — otherwise the last widget, sitting at the bottom of the
  // content, would have no row below it to grow into.
  const [resizing, setResizing] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const measure = () => setFillHeight(element.clientHeight);
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

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

  // How many rows the filled area holds, so an item can be dropped into the
  // empty space below the last widget but not dragged off the bottom of the
  // screen. Never below the rows already occupied, or the grid would clamp a
  // saved placement on load. A pointer resize is exempt: uncapping the rows
  // while resizing lets the bottom-most widget grow taller than the content it
  // sits under (the page scrolls), which the cap would otherwise forbid.
  const occupiedRows = gridItems.reduce(
    (lowest, item) => Math.max(lowest, item.y + item.h),
    1,
  );
  const fillRows = Math.max(
    1,
    Math.ceil((fillHeight + GRID_MARGIN) / (GRID_ROW_HEIGHT + GRID_MARGIN)),
  );
  const maxRows = resizing
    ? Number.POSITIVE_INFINITY
    : Math.max(fillRows, occupiedRows);

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
      showDragHandle={editing && !isMobile}
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
    <div ref={containerRef} className="relative flex-1">
      {!mounted ? null : isMobile ? (
        <div className="flex flex-col gap-4">
          {singleColumnWidgets.map((widget) => (
            <div key={widget.instance.key}>{renderCard(widget)}</div>
          ))}
        </div>
      ) : (
        <>
          {editing && fillHeight > 0 ? (
            <GridBackground
              width={width}
              cols={GRID_COLUMNS}
              rowHeight={GRID_ROW_HEIGHT}
              margin={[GRID_MARGIN, GRID_MARGIN]}
              containerPadding={[0, 0]}
              rows="auto"
              height={fillHeight}
              color="var(--color-border)"
              borderRadius={6}
              style={{ opacity: 0.35 }}
            />
          ) : null}
          <GridLayout
            width={width}
            layout={gridItems}
            gridConfig={{
              cols: GRID_COLUMNS,
              rowHeight: GRID_ROW_HEIGHT,
              margin: [GRID_MARGIN, GRID_MARGIN],
              containerPadding: [0, 0],
              maxRows,
            }}
            dragConfig={{ enabled: editing, handle: `.${EDIT_MODE_DRAG_HANDLE}` }}
            resizeConfig={{ enabled: editing && !isCoarsePointer }}
            onDragStop={(layout, _oldItem, newItem) =>
              onLayoutChange(layout, newItem?.i)
            }
            onResizeStart={() => setResizing(true)}
            onResizeStop={(layout, _oldItem, newItem) => {
              setResizing(false);
              onLayoutChange(layout, newItem?.i);
            }}
            compactor={verticalCompactor}
            style={editing ? { minHeight: fillHeight } : undefined}
          >
            {widgets.map((widget) => (
              <div key={widget.instance.key} className="h-full">
                {renderCard(widget)}
              </div>
            ))}
          </GridLayout>
        </>
      )}
    </div>
  );
};
