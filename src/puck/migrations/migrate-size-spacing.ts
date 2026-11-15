/**
 * One-off migration for Puck documents saved before the single `dimension` prop
 * was split into `size` and `spacing`.
 *
 * The transform is deliberately pure and shape-based: it walks every object in
 * the document and acts on any `props` object holding a `dimension` key, so the
 * document root — which has props but no `type` — and blocks nested in slots and
 * zones are converted too. Component types are never consulted, so an unknown
 * block with a stored `dimension` is migrated like any other.
 *
 * Running it twice is a no-op because a converted document has no `dimension`
 * key left; the second run reports no changes.
 */

import { BREAKPOINTS } from "@/puck/utils/breakpoints";
import type { Breakpoint } from "@/puck/utils/breakpoints";

type PlainObject = Record<string, unknown>;

/**
 * The responsive ladder is the one `src/puck/utils/breakpoints.ts` owns: a
 * stored `dimension` is keyed only by those three names, and a key outside the
 * table means the value is not a responsive map.
 */
const isBreakpoint = (key: string): key is Breakpoint =>
  Object.prototype.hasOwnProperty.call(BREAKPOINTS, key);

/** The eight keys that move from `dimension` to `spacing`. */
const SPACING_KEYS = new Set([
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
]);

export interface SizeSpacingMigrationChange {
  /** Block type whose props were split, or `root` for the document root. */
  componentType: string;
  /** Block id, when the stored props carry one. */
  componentId?: string;
  /** Property names written into `size`, unique across the breakpoints. */
  size: string[];
  /** Property names written into `spacing`, unique across the breakpoints. */
  spacing: string[];
}

export interface SizeSpacingMigrationWarning {
  /** Block type that was left alone, or `root` for the document root. */
  componentType: string;
  /** Block id, when the stored props carry one. */
  componentId?: string;
  /** Human-readable reason the props were left untouched. */
  reason: string;
}

export interface SizeSpacingMigrationResult<T> {
  /** Migrated copy: the input document is never mutated. */
  data: T;
  /** One entry per converted props object. */
  changes: SizeSpacingMigrationChange[];
  /** Props that could not be converted and were preserved as they are. */
  warnings: SizeSpacingMigrationWarning[];
}

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readComponentId(props: PlainObject): string | undefined {
  return typeof props.id === "string" ? props.id : undefined;
}

/**
 * A stored `dimension` is a responsive map: an object keyed only by breakpoint
 * names. Anything else is reported instead of being rewritten, so a value the
 * migration does not understand is never thrown away.
 */
function isResponsiveDimension(value: unknown): value is PlainObject {
  if (!isPlainObject(value)) return false;

  const keys = Object.keys(value);

  return (
    keys.length > 0 && keys.every((key) => isBreakpoint(key))
  );
}

/**
 * Merge the values moved out of `dimension` with a `size` or `spacing` object
 * that already exists on the same props.
 *
 * A props object carrying both shapes is not expected in production, where code
 * and data change together, but it is possible in a development database: the
 * new editor writes `size` and `spacing` and leaves an unconverted `dimension`
 * beside them. The new shape is the source of truth, so an existing value wins
 * over the moved one and a key only the old shape had still carries over.
 */
function mergeResponsive(moved: PlainObject, existing: PlainObject): PlainObject {
  const merged: PlainObject = {};

  for (const [breakpoint, rung] of Object.entries(moved)) {
    const existingRung = existing[breakpoint];
    merged[breakpoint] =
      isPlainObject(existingRung) && isPlainObject(rung)
        ? { ...rung, ...existingRung }
        : rung;
  }

  for (const [breakpoint, rung] of Object.entries(existing)) {
    if (!Object.prototype.hasOwnProperty.call(merged, breakpoint)) {
      merged[breakpoint] = rung;
    }
  }

  return merged;
}

/**
 * Split one `props` object's `dimension` into `size` and `spacing`.
 *
 * The eight margin and padding keys move to `spacing`; every other key is the
 * box's own size and moves to `size`. `spacing` is only written when at least
 * one spacing key is present, so a size-only document does not gain an empty
 * object. A `dimension` that is not a responsive map, or a `size`/`spacing`
 * sibling that is not an object, is preserved and reported.
 */
function migrateProps(
  componentType: string,
  props: PlainObject,
  changes: SizeSpacingMigrationChange[],
  warnings: SizeSpacingMigrationWarning[],
): void {
  if (!Object.prototype.hasOwnProperty.call(props, "dimension")) return;

  const componentId = readComponentId(props);
  const dimension = props.dimension;

  if (!isResponsiveDimension(dimension)) {
    warnings.push({
      componentType,
      componentId,
      reason: "dimension is not a responsive map; left unchanged",
    });

    return;
  }

  for (const [breakpoint, rung] of Object.entries(dimension)) {
    if (!isPlainObject(rung)) {
      warnings.push({
        componentType,
        componentId,
        reason: `dimension.${breakpoint} is not an object; left unchanged`,
      });

      return;
    }
  }

  for (const target of ["size", "spacing"] as const) {
    if (props[target] !== undefined && !isPlainObject(props[target])) {
      warnings.push({
        componentType,
        componentId,
        reason: `${target} is not an object; dimension left unchanged`,
      });

      return;
    }
  }

  const movedSize: PlainObject = {};
  const movedSpacing: PlainObject = {};
  const sizeFields: string[] = [];
  const spacingFields: string[] = [];

  const rungs = Object.entries(dimension) as [string, PlainObject][];

  for (const [breakpoint, rung] of rungs) {
    const sizeRung: PlainObject = {};
    const spacingRung: PlainObject = {};

    for (const [key, value] of Object.entries(rung)) {
      const intoSpacing = SPACING_KEYS.has(key);
      const target = intoSpacing ? spacingRung : sizeRung;
      target[key] = value;

      const fields = intoSpacing ? spacingFields : sizeFields;
      if (!fields.includes(key)) fields.push(key);
    }

    // A rung that kept no key of this destination is left out: an absent
    // breakpoint and an empty one cascade the same way, and the panel never
    // writes an empty rung.
    if (Object.keys(sizeRung).length > 0) movedSize[breakpoint] = sizeRung;
    if (Object.keys(spacingRung).length > 0) {
      movedSpacing[breakpoint] = spacingRung;
    }
  }

  if (sizeFields.length > 0) {
    props.size = isPlainObject(props.size)
      ? mergeResponsive(movedSize, props.size)
      : movedSize;
  }

  if (spacingFields.length > 0) {
    props.spacing = isPlainObject(props.spacing)
      ? mergeResponsive(movedSpacing, props.spacing)
      : movedSpacing;
  }

  delete props.dimension;
  changes.push({ componentType, componentId, size: sizeFields, spacing: spacingFields });
}

/**
 * Walk a cloned document and split every `dimension` it finds.
 *
 * Props are detected by their shape (`{ props }`) rather than by the top-level
 * `content` array, so the document root and nested slots and zones are covered.
 * Malformed component data is skipped without throwing.
 */
function visitNode(
  node: unknown,
  changes: SizeSpacingMigrationChange[],
  warnings: SizeSpacingMigrationWarning[],
): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      visitNode(item, changes, warnings);
    }

    return;
  }

  if (!isPlainObject(node)) return;

  if (isPlainObject(node.props)) {
    const componentType = typeof node.type === "string" ? node.type : "root";
    migrateProps(componentType, node.props, changes, warnings);
  }

  for (const value of Object.values(node)) {
    visitNode(value, changes, warnings);
  }
}

/**
 * Pure document migration used by the one-off Size and Spacing backfill.
 *
 * The returned copy keeps unknown fields and unknown block types intact. The
 * caller can use `changes.length` to decide whether the document needs to be
 * written back.
 */
export function migrateSizeSpacing<T>(puckData: T): SizeSpacingMigrationResult<T> {
  const data = structuredClone(puckData);
  const changes: SizeSpacingMigrationChange[] = [];
  const warnings: SizeSpacingMigrationWarning[] = [];

  visitNode(data, changes, warnings);

  return { data, changes, warnings };
}
