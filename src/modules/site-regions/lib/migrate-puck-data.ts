/**
 * One-off migration for Site region documents saved before the Header and
 * Footer blocks grouped their props under `content`.
 *
 * The transform is deliberately pure and value-based: it walks every object in
 * the document, so blocks nested in slots and zones are converted too, and it
 * never touches component types it does not know. Running it twice is a no-op
 * because a converted block already has a `content` object and no flat props.
 *
 * The Top bar is excluded on purpose: its concept changed from a fixed
 * announcement to a generic container, so a document containing the legacy
 * `AnnouncementBar` block is recreated by hand in the editor instead of being
 * rewritten. The transform reports those blocks as warnings so the owner can
 * find them.
 */

type PlainObject = Record<string, unknown>;

/** Legacy flat props that moved inside each block's `content` object. */
const LEGACY_FLAT_PROPS = {
  Brand: ["showLogo", "showSiteName", "customText", "customLogoUrl"],
  SearchBar: ["placeholder", "variant"],
  NavbarBlock: ["items", "layout"],
  LinkList: ["title", "links"],
  Copyright: ["showYear", "extraText", "links"],
} as const satisfies Record<string, readonly string[]>;

type MigratableComponentType = keyof typeof LEGACY_FLAT_PROPS;

const LEGACY_ANNOUNCEMENT_BAR = "AnnouncementBar";

export interface PuckDataMigrationChange {
  /** Block type whose props were reshaped. */
  componentType: MigratableComponentType;
  /** Block id, when the stored props carry one. */
  componentId?: string;
  /** Legacy props moved into `content` or discarded as duplicates. */
  fields: string[];
}

export interface PuckDataMigrationWarning {
  /** Block type that could not be migrated or needs a follow-up action. */
  componentType: string;
  /** Block id, when the stored props carry one. */
  componentId?: string;
  /** Human-readable reason the block was left alone. */
  reason: string;
}

export interface PuckDataMigrationResult<T> {
  /** Migrated copy: the input document is never mutated. */
  data: T;
  /** One entry per converted block. */
  changes: PuckDataMigrationChange[];
  /** Blocks that could not be converted or need a manual follow-up. */
  warnings: PuckDataMigrationWarning[];
}

function isPlainObject(value: unknown): value is PlainObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readComponentId(props: PlainObject): string | undefined {
  return typeof props.id === "string" ? props.id : undefined;
}

function isMigratableType(type: unknown): type is MigratableComponentType {
  return (
    typeof type === "string" &&
    Object.prototype.hasOwnProperty.call(LEGACY_FLAT_PROPS, type)
  );
}

/**
 * Reshape the legacy flat props of one block into its nested `content` object.
 *
 * A block with a `content` object is normally already migrated, but stale flat
 * props can remain after a partial save. Their values are merged into `content`
 * when the field is missing; a flat value that `content` already defines is
 * discarded, because the nested shape is the source of truth. That keeps the
 * transform idempotent without silently losing a saved flat value.
 *
 * A non-object `content` is treated as malformed data: it is preserved and
 * reported so a single bad block cannot abort the whole document.
 */
function migrateBlock(
  type: MigratableComponentType,
  props: PlainObject,
  changes: PuckDataMigrationChange[],
  warnings: PuckDataMigrationWarning[],
): void {
  const componentId = readComponentId(props);
  const legacyFields = LEGACY_FLAT_PROPS[type].filter((field) =>
    Object.prototype.hasOwnProperty.call(props, field),
  );

  if (legacyFields.length === 0) return;

  if (props.content !== undefined && !isPlainObject(props.content)) {
    warnings.push({
      componentType: type,
      componentId,
      reason: "content is not an object; flat props left unchanged",
    });

    return;
  }

  const content = isPlainObject(props.content) ? props.content : {};

  for (const field of legacyFields) {
    if (Object.prototype.hasOwnProperty.call(content, field)) {
      delete props[field];
      warnings.push({
        componentType: type,
        componentId,
        reason: `content already defines "${field}"; flat value discarded`,
      });

      continue;
    }

    content[field] = props[field];
    delete props[field];
  }

  props.content = content;
  changes.push({ componentType: type, componentId, fields: legacyFields });
}

/**
 * Walk a cloned document and migrate every recognisable component.
 *
 * Components are detected by their Puck shape (`{ type, props }`), not only by
 * the top-level `content` array, so nested slots and zones are covered. Unknown
 * component types and malformed component data are simply skipped.
 */
function visitNode(
  node: unknown,
  changes: PuckDataMigrationChange[],
  warnings: PuckDataMigrationWarning[],
): void {
  if (Array.isArray(node)) {
    for (const item of node) {
      visitNode(item, changes, warnings);
    }

    return;
  }

  if (!isPlainObject(node)) return;

  if (isMigratableType(node.type) && isPlainObject(node.props)) {
    migrateBlock(node.type, node.props, changes, warnings);
  }

  if (node.type === LEGACY_ANNOUNCEMENT_BAR && isPlainObject(node.props)) {
    warnings.push({
      componentType: LEGACY_ANNOUNCEMENT_BAR,
      componentId: readComponentId(node.props),
      reason:
        "legacy AnnouncementBar block is not migrated; recreate it as a Top bar in the editor",
    });
  }

  for (const value of Object.values(node)) {
    visitNode(value, changes, warnings);
  }
}

/**
 * Pure document migration used by the one-off Site region backfill.
 *
 * The returned copy keeps unknown fields and unknown block types intact. The
 * caller can use `changes.length` to decide whether the document needs to be
 * written back.
 */
export function migrateSiteRegionPuckData<T>(puckData: T): PuckDataMigrationResult<T> {
  const data = structuredClone(puckData);
  const changes: PuckDataMigrationChange[] = [];
  const warnings: PuckDataMigrationWarning[] = [];

  visitNode(data, changes, warnings);

  return { data, changes, warnings };
}
