import type { MediaLibraryView } from "../constants";

/** The columns the folder tree needs; a row carries no children yet. */
export interface MediaFolderRow {
  id: string;
  name: string;
  parentId: string | null;
}

/** A row plus the children the server already nested under it. */
export interface MediaFolderNode extends MediaFolderRow {
  children: MediaFolderNode[];
}

/**
 * A child folder as the grid draws it: the row plus how many active Media are
 * filed directly in it. Archived Media are not counted, so the number matches
 * the rows that open the folder shows.
 */
export interface MediaFolderSummary extends MediaFolderRow {
  mediaCount: number;
}

/**
 * The folder the editor has open: the selected folder while My Drive is the
 * view, and none in a flat view over the whole library such as Recent or
 * Archived. Uploads land here and the tree highlights it.
 */
export function openMediaFolderId({
  view,
  folderId,
}: {
  view: MediaLibraryView;
  folderId: string | null;
}): string | null {
  return view === "active" ? folderId : null;
}

/**
 * Turn the flat rows the database returns into the nested tree the sidebar
 * renders. Children are ordered by name, so two reads of the same rows draw the
 * same tree. A row whose parent is missing from the list is kept as a root
 * rather than dropped: the foreign key makes that impossible, and a display
 * must never hide a folder the library holds.
 */
export function buildFolderTree(rows: MediaFolderRow[]): MediaFolderNode[] {
  const nodes = new Map<string, MediaFolderNode>(
    rows.map((row) => [row.id, { ...row, children: [] }]),
  );
  const roots: MediaFolderNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.parentId ? nodes.get(node.parentId) : undefined;

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const byName = (a: MediaFolderNode, b: MediaFolderNode) => {
    const nameOrder = a.name.localeCompare(b.name);
    return nameOrder !== 0 ? nameOrder : a.id.localeCompare(b.id);
  };

  const sortLevel = (level: MediaFolderNode[]) => {
    level.sort(byName);
    for (const node of level) sortLevel(node.children);
  };
  sortLevel(roots);

  return roots;
}

/**
 * Whether filing `folderId` under `nextParentId` would put a folder inside
 * itself. Walking up from the proposed parent catches both a direct self-parent
 * and a move into a descendant; an existing cycle in the rows is refused too,
 * because it would leave the walk with no root to stop at.
 */
export function wouldCreateCycle(
  rows: MediaFolderRow[],
  folderId: string,
  nextParentId: string | null,
): boolean {
  if (!nextParentId) return false;

  const byId = new Map(rows.map((row) => [row.id, row]));
  const visited = new Set<string>();
  let cursor: string | null = nextParentId;

  while (cursor) {
    if (cursor === folderId || visited.has(cursor)) return true;
    visited.add(cursor);
    cursor = byId.get(cursor)?.parentId ?? null;
  }

  return false;
}
