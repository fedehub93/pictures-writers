export type SortDirection = "asc" | "desc";

export const SORT_DIRECTIONS = ["asc", "desc"] as const;

/**
 * Editorial priority for versioned content: everything not yet published comes
 * before published items. PostgreSQL stores `ContentStatus` as an enum ordered
 * `DRAFT, CHANGED, PUBLISHED, SCHEDULED`, so this "unpublished first" grouping
 * cannot be expressed with a plain `orderBy`; we rank explicitly instead.
 */
const STATUS_RANK: Record<string, number> = {
  DRAFT: 0,
  CHANGED: 1,
  SCHEDULED: 2,
  PUBLISHED: 3,
};

export interface DefaultSortableRow {
  id: string;
  title: string;
  status: string;
  publishedAt: Date | null;
}

interface BuildListOrderByArgs {
  sort?: string | null;
  direction?: SortDirection | null;
  sortable: readonly string[];
  /**
   * Optional relation path to nest the sorted field under. Root + Version
   * lists sort on fields owned by the version (e.g. `currentVersion.title`)
   * while keeping the root `id` as the top-level tie-breaker, so the helper no
   * longer assumes the sorted fields live flat on the queried model.
   */
  relation?: string;
}

const rankOf = (status: string) =>
  STATUS_RANK[status] ?? Number.MAX_SAFE_INTEGER;

function compareNullableDateDesc(a: Date | null, b: Date | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return b.getTime() - a.getTime();
}

function compareTextAsc(a: string, b: string): number {
  const at = a.toLowerCase();
  const bt = b.toLowerCase();
  if (at < bt) return -1;
  if (at > bt) return 1;
  return 0;
}

/**
 * Default editorial order for versioned content lists:
 * unpublished statuses first (`DRAFT`, `CHANGED`, `SCHEDULED`), then
 * `PUBLISHED`; within a status the most recently published first, then
 * alphabetically by title, then by id for a deterministic order.
 */
export function compareDefaultOrder<T extends DefaultSortableRow>(
  a: T,
  b: T,
): number {
  const byStatus = rankOf(a.status) - rankOf(b.status);
  if (byStatus !== 0) return byStatus;

  const byPublishedAt = compareNullableDateDesc(a.publishedAt, b.publishedAt);
  if (byPublishedAt !== 0) return byPublishedAt;

  const byTitle = compareTextAsc(a.title, b.title);
  if (byTitle !== 0) return byTitle;

  return compareTextAsc(a.id, b.id);
}

export function sortByDefaultOrder<T extends DefaultSortableRow>(
  rows: T[],
): T[] {
  return [...rows].sort(compareDefaultOrder);
}

/**
 * Builds a Prisma `orderBy` for the explicit column sort chosen by the user.
 * Returns `null` when no (valid) sort is set so callers can fall back to
 * {@link sortByDefaultOrder}. Nullable publication dates always sort with
 * `nulls` pinned so scheduling (nulls last) and publication (nulls first)
 * grouping stay stable regardless of direction; `id` is a stable tiebreaker.
 */
export function buildListOrderBy<TOrderBy>({
  sort,
  direction,
  sortable,
  relation,
}: BuildListOrderByArgs): TOrderBy[] | null {
  if (!sort || !sortable.includes(sort)) {
    return null;
  }

  const dir: SortDirection = direction ?? "desc";
  const primary =
    sort === "publishedAt"
      ? { publishedAt: { sort: dir, nulls: "first" } }
      : sort === "scheduledAt"
        ? { scheduledAt: { sort: dir, nulls: "last" } }
        : { [sort]: dir };

  return [
    relation ? { [relation]: primary } : primary,
    { id: "asc" },
  ] as unknown as TOrderBy[];
}
