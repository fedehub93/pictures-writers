export type SortDirection = "asc" | "desc";

export const SORT_DIRECTIONS = ["asc", "desc"] as const;

/**
 * Default ordering for versioned content lists: unpublished versions
 * (`publishedAt` null) first, then the most recently published, then by
 * lifecycle status and title for a deterministic order.
 */
export const DEFAULT_PUBLISHED_ORDER_BY = [
  { publishedAt: { sort: "desc", nulls: "first" } },
  { status: "asc" },
  { title: "asc" },
  { id: "asc" },
] as const;

interface BuildListOrderByArgs {
  sort?: string | null;
  direction?: SortDirection | null;
  sortable: readonly string[];
}

/**
 * Builds a Prisma `orderBy` for the explicit column sort chosen by the user.
 * Falls back to {@link DEFAULT_PUBLISHED_ORDER_BY} when no (valid) sort is set.
 * Nullable publication dates always sort nulls first so unpublished content
 * stays grouped; a stable `id` tiebreaker keeps pagination deterministic.
 */
export function buildListOrderBy<TOrderBy>({
  sort,
  direction,
  sortable,
}: BuildListOrderByArgs): TOrderBy[] {
  if (!sort || !sortable.includes(sort)) {
    return DEFAULT_PUBLISHED_ORDER_BY as unknown as TOrderBy[];
  }

  const dir: SortDirection = direction ?? "desc";
  const primary =
    sort === "publishedAt"
      ? { publishedAt: { sort: dir, nulls: "first" } }
      : { [sort]: dir };

  return [primary, { id: "asc" }] as unknown as TOrderBy[];
}
