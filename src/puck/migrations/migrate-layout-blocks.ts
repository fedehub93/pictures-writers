/**
 * One-off migration for Puck documents saved before Flex and Grid retired.
 *
 * Flex and Grid were three registrations of one block; the difference was the
 * `display` mode in their default props. A stored node may therefore carry no
 * layout at all, and still render as a flex row or a grid because the block
 * defaults supply the mode at render time. Renaming such a node to Container
 * without writing that value would turn a page of grids into a column of
 * blocks, so the transform writes the mode the node used to have into the
 * desktop rung before it changes the type.
 *
 * An authored display is left alone. A stored `layout` replaces the block
 * defaults wholesale through the shallow merge both render paths use, so any
 * node that carries a display in its ladder was never rendered with the type's
 * default. Writing the mode into the desktop rung would overwrite an authored
 * value — or add a desktop value to a node that only declares one for a
 * narrower rung. The transform only visits nodes whose type is `Flex` or
 * `Grid`, so every other block, the document root and every unknown type are
 * preserved untouched.
 *
 * Running it twice is a no-op because no retired type remains after the first
 * run; the second run reports no changes.
 */

import { BREAKPOINTS } from "@/puck/utils/breakpoints";
import type { Breakpoint } from "@/puck/utils/breakpoints";

type PlainObject = Record<string, unknown>;

type DisplayMode = "flex" | "grid";

/** The display mode each retired block rendered with through its defaults. */
const RETIRED_MODES = {
  Flex: "flex",
  Grid: "grid",
} as const satisfies Record<string, DisplayMode>;

type RetiredType = keyof typeof RETIRED_MODES;

const isRetiredType = (type: unknown): type is RetiredType =>
  typeof type === "string" &&
  Object.prototype.hasOwnProperty.call(RETIRED_MODES, type);

export interface LayoutBlockMigrationChange {
  /** Type the node had before the migration. */
  componentType: RetiredType;
  /** Block id, when the stored props carry one. */
  componentId?: string;
  /** The mode the node rendered with, now the Container's display. */
  display: DisplayMode;
  /**
   * Whether the transform had to write the desktop display. A node that
   * already declared a display anywhere in the ladder keeps it.
   */
  wroteDisplay: boolean;
}

export interface LayoutBlockMigrationWarning {
  /** Type the node still has. */
  componentType: RetiredType;
  /** Block id, when the stored props carry one. */
  componentId?: string;
  /** Human-readable reason the node was left untouched. */
  reason: string;
}

export interface LayoutBlockMigrationResult<T> {
  /** Migrated copy: the input document is never mutated. */
  data: T;
  /** One entry per retired node rewritten to a Container. */
  changes: LayoutBlockMigrationChange[];
  /** Retired nodes that could not be converted and were preserved as they are. */
  warnings: LayoutBlockMigrationWarning[];
}

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Whether any rung of the responsive ladder declares a display.
 *
 * Only the three known breakpoints count as rungs: a stray key on the layout
 * object is not a rung, and its `display` must not suppress the value the node
 * used to render with.
 */
function declaresDisplay(layout: unknown): boolean {
  if (!isPlainObject(layout)) return false;

  return (Object.keys(BREAKPOINTS) as Breakpoint[]).some((breakpoint) => {
    const rung = layout[breakpoint];

    return isPlainObject(rung) && rung.display !== undefined;
  });
}

/**
 * Write the display into the desktop rung, keeping every authored layout value
 * around it. Other rungs and other desktop properties survive, so a node with a
 * gap and no display keeps the gap and gains the mode.
 */
function writeDesktopDisplay(layout: unknown, display: DisplayMode): PlainObject {
  const next: PlainObject = isPlainObject(layout) ? { ...layout } : {};
  const desktop = isPlainObject(next.desktop) ? { ...next.desktop } : {};

  desktop.display = display;
  next.desktop = desktop;

  return next;
}

/**
 * Rewrite one retired node in place. The caller clones the document first.
 */
function migrateNode(
  node: PlainObject,
  changes: LayoutBlockMigrationChange[],
  warnings: LayoutBlockMigrationWarning[],
): void {
  if (!isRetiredType(node.type)) return;

  const componentType = node.type;

  if (!isPlainObject(node.props)) {
    warnings.push({
      componentType,
      reason: "props is not an object; left unchanged",
    });

    return;
  }

  const display = RETIRED_MODES[componentType];
  const props = node.props;
  const wroteDisplay = !declaresDisplay(props.layout);

  // The display comes first: the surviving Container has no default that would
  // restore it, so the value has to be in the document before the type changes.
  if (wroteDisplay) {
    props.layout = writeDesktopDisplay(props.layout, display);
  }

  node.type = "Container";
  changes.push({
    componentType,
    componentId:
      typeof props.id === "string" ? props.id : undefined,
    display,
    wroteDisplay,
  });
}

/**
 * Walk a cloned document and rewrite every retired node.
 *
 * Props are detected by their shape (`{ props }`) rather than by the top-level
 * `content` array, so slots and zones are covered too. Malformed component data
 * is skipped without throwing.
 */
function visitNode(
  node: unknown,
  changes: LayoutBlockMigrationChange[],
  warnings: LayoutBlockMigrationWarning[],
): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      visitNode(item, changes, warnings);
    }

    return;
  }

  if (!isPlainObject(node)) return;

  migrateNode(node, changes, warnings);

  for (const value of Object.values(node)) {
    visitNode(value, changes, warnings);
  }
}

/**
 * Pure document migration used by the one-off Flex and Grid backfill.
 *
 * The returned copy keeps unknown fields and unknown block types intact. The
 * caller can use `changes.length` to decide whether the document needs to be
 * written back.
 */
export function migrateLayoutBlocks<T>(puckData: T): LayoutBlockMigrationResult<T> {
  const data = structuredClone(puckData);
  const changes: LayoutBlockMigrationChange[] = [];
  const warnings: LayoutBlockMigrationWarning[] = [];

  visitNode(data, changes, warnings);

  return { data, changes, warnings };
}
