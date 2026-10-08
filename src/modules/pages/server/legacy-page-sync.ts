import "server-only";

import {
  Prisma,
  type ContentStatus,
  type PageEditorType,
  type PageVersion,
} from "@/generated/prisma";

/**
 * Snapshot of a `PageVersion` projected onto the legacy `Page` columns. Used by
 * the dual-write step that keeps the old table readable until the cut-over.
 */
export interface LegacyPageSnapshot {
  id: string;
  rootId: string;
  version: number;
  title: string;
  slug: string;
  status: ContentStatus;
  isLatest: boolean;
  editorType: PageEditorType;
  puckData: PrismaJson.PuckData | null;
  seoId: string | null;
  userId: string | null;
  publishedAt?: Date;
  firstPublishedAt?: Date;
}

interface LegacySnapshotOverrides {
  slug: string;
  status: ContentStatus;
  isLatest: boolean;
  publishedAt?: Date;
  firstPublishedAt?: Date;
}

/**
 * Project a version plus its root slug onto the legacy `Page` shape, so the
 * dual-write call sites cannot drift from each other.
 */
export function toLegacySnapshot(
  version: PageVersion,
  overrides: LegacySnapshotOverrides,
): LegacyPageSnapshot {
  return {
    id: version.id,
    rootId: version.rootId,
    version: version.version,
    title: version.title,
    slug: overrides.slug,
    status: overrides.status,
    isLatest: overrides.isLatest,
    editorType: version.editorType,
    puckData: version.puckData,
    seoId: version.seoId,
    userId: version.userId,
    ...(overrides.publishedAt !== undefined
      ? { publishedAt: overrides.publishedAt }
      : {}),
    ...(overrides.firstPublishedAt !== undefined
      ? { firstPublishedAt: overrides.firstPublishedAt }
      : {}),
  };
}

/**
 * Insert or update the legacy `Page` row that mirrors a version. Reusing the
 * version id keeps the legacy row, the version and the backfill identity in
 * sync. Safe to run even when the legacy row was never created (e.g. after the
 * read path stopped depending on it).
 */
export async function upsertLegacyPage(
  tx: Prisma.TransactionClient,
  input: LegacyPageSnapshot,
): Promise<void> {
  const payload = {
    rootId: input.rootId,
    version: input.version,
    title: input.title,
    slug: input.slug,
    status: input.status,
    isLatest: input.isLatest,
    editorType: input.editorType,
    puckData: input.puckData ?? Prisma.DbNull,
    seoId: input.seoId,
    userId: input.userId,
    ...(input.publishedAt !== undefined
      ? { publishedAt: input.publishedAt }
      : {}),
    ...(input.firstPublishedAt !== undefined
      ? { firstPublishedAt: input.firstPublishedAt }
      : {}),
  };

  const existing = await tx.page.findUnique({
    where: { id: input.id },
    select: { id: true },
  });

  if (existing) {
    await tx.page.update({ where: { id: input.id }, data: payload });
  } else {
    await tx.page.create({ data: { id: input.id, ...payload } });
  }
}
