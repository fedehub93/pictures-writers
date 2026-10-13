import type {
  DashboardWidgetInstance,
  WidgetDefinition,
  WidgetGridPlacement,
  WidgetGridSize,
  WidgetSize,
} from "@/shared/dashboard/types";

/** The dashboard grid's column count from `md` up (single column below). */
export const GRID_COLUMNS = 12;

/** The pixel height of one grid row. */
export const GRID_ROW_HEIGHT = 80;

/** The [x, y] gap between grid cells, in pixels. */
export const GRID_MARGIN = 16;

interface WidgetPreset {
  /** The placement a newly added instance of the preset is seeded with. */
  seed: WidgetGridSize;
  /** The smallest legible placement an instance may shrink to. */
  min: WidgetGridSize;
}

/**
 * The size presets a Widget definition may declare. A preset is a shape, not an
 * identity: it seeds a new instance's placement and provides the legibility
 * bounds a definition may override.
 */
export const WIDGET_SIZE_PRESETS: Record<WidgetSize, WidgetPreset> = {
  small: { seed: { w: 3, h: 3 }, min: { w: 2, h: 2 } },
  medium: { seed: { w: 6, h: 4 }, min: { w: 3, h: 3 } },
  full: { seed: { w: 12, h: 5 }, min: { w: 6, h: 3 } },
};

/** Human labels for a Widget definition's size preset. */
export const WIDGET_SIZE_LABEL: Record<WidgetSize, string> = {
  small: "Small",
  medium: "Medium",
  full: "Full",
};

/** The smallest and largest placement a definition's widget may occupy. */
export interface ResolvedWidgetBounds {
  minW: number;
  minH: number;
  maxW: number;
  /** Absent when the definition imposes no height ceiling. */
  maxH?: number;
}

/** A definition's resolved seed size and legibility bounds. */
export interface ResolvedWidgetLayout {
  seed: WidgetGridSize;
  bounds: ResolvedWidgetBounds;
}

/**
 * Resolves a definition's size preset — and any per-definition override — into
 * the seed size a new instance starts at and the bounds it may occupy. The
 * definition owns these bounds, so a saved instance never carries them.
 */
export const resolveWidgetLayout = (
  definition: WidgetDefinition,
): ResolvedWidgetLayout => {
  const preset = WIDGET_SIZE_PRESETS[definition.defaultSize];

  const minW = definition.minGrid?.w ?? preset.min.w;
  const minH = definition.minGrid?.h ?? preset.min.h;
  const maxW = definition.maxGrid?.w ?? GRID_COLUMNS;
  const maxH = definition.maxGrid?.h;

  return {
    // Keep the seed inside the definition's own bounds: a definition whose
    // floor is above its preset (or whose ceiling is below it) still seeds a
    // legible, permitted placement.
    seed: {
      w: clamp(preset.seed.w, minW, maxW),
      h: clamp(preset.seed.h, minH, maxH ?? Number.POSITIVE_INFINITY),
    },
    bounds: { minW, minH, maxW, maxH },
  };
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const overlaps = (a: WidgetGridPlacement, b: WidgetGridPlacement) =>
  a.x < b.x + b.w &&
  a.x + a.w > b.x &&
  a.y < b.y + b.h &&
  a.y + a.h > b.y;

/**
 * Finds the first free slot — scanning row by row, left to right — that fits an
 * instance of `span`, given the placements already on the grid. The caller
 * supplies the width and height; this returns only the origin.
 */
export const firstFreeSlot = (
  placements: WidgetGridPlacement[],
  span: WidgetGridSize,
): { x: number; y: number } => {
  const w = Math.min(span.w, GRID_COLUMNS);
  const bottom = placements.reduce(
    (max, placement) => Math.max(max, placement.y + placement.h),
    0,
  );

  for (let y = 0; y <= bottom; y += 1) {
    for (let x = 0; x + w <= GRID_COLUMNS; x += 1) {
      const candidate = { x, y, w, h: span.h };
      if (!placements.some((placement) => overlaps(candidate, placement))) {
        return { x, y };
      }
    }
  }

  // Nothing fits above the existing stack: place the instance below it.
  return { x: 0, y: bottom };
};

/** The full placement a newly added instance of `definition` should occupy. */
export const seedPlacement = (
  definition: WidgetDefinition,
  placements: WidgetGridPlacement[],
): WidgetGridPlacement => {
  const { seed } = resolveWidgetLayout(definition);
  const { x, y } = firstFreeSlot(placements, seed);

  return { x, y, w: seed.w, h: seed.h };
};

/**
 * Orders instances row-major — by row, then by column — for the single-column
 * collapse below the `md` breakpoint, where the two-dimensional arrangement
 * reads top to bottom.
 */
export const sortForSingleColumn = (
  instances: DashboardWidgetInstance[],
): DashboardWidgetInstance[] =>
  [...instances].sort(
    (a, b) => a.grid.y - b.grid.y || a.grid.x - b.grid.x,
  );

/** A grid item: an instance's placement plus the bounds its definition resolves. */
export interface DashboardGridItem
  extends WidgetGridPlacement,
    ResolvedWidgetBounds {
  i: string;
}

/**
 * Converts instances and their definitions into the grid's layout array,
 * attaching each instance's placement and its definition's resolved bounds.
 * Instances whose definition is unknown are dropped.
 */
export const toGridItems = (
  instances: DashboardWidgetInstance[],
  definitions: WidgetDefinition[],
): DashboardGridItem[] => {
  const definitionById = new Map(
    definitions.map((definition) => [definition.id, definition]),
  );

  return instances.flatMap((instance) => {
    const definition = definitionById.get(instance.definitionId);
    if (!definition) return [];

    const { bounds } = resolveWidgetLayout(definition);

    return [
      {
        i: instance.key,
        x: instance.grid.x,
        y: instance.grid.y,
        w: instance.grid.w,
        h: instance.grid.h,
        ...bounds,
      },
    ];
  });
};
