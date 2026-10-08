import { ContentStatus, type Page } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { toPageVersionData } from "./root-version";

export interface PageRootVersionBackfillResult {
  rootsProcessed: number;
  versionsProcessed: number;
}

/**
 * Select the version that should become the root's live version: a published
 * version, preferring the one the legacy `isLatest` flag pointed at and, as a
 * tie-breaker, the highest version number.
 */
function pickLiveVersion(published: Page[]): Page | undefined {
  return [...published].sort((a, b) => {
    if (a.isLatest !== b.isLatest) {
      return a.isLatest ? -1 : 1;
    }
    return b.version - a.version;
  })[0];
}

/**
 * One-time backfill that reconstructs the Root + Version model from the legacy
 * `Page` table. Each legacy `rootId` group becomes one `PageRoot`; each legacy
 * row becomes a `PageVersion` reusing the legacy id. `currentVersionId` is the
 * highest revision and `liveVersionId` is the published version, if any.
 *
 * Non-destructive and re-runnable: existing roots and versions are left
 * untouched (only missing rows are inserted, only unset pointers are filled),
 * so running it again never rewrites work done through the new model and the
 * legacy table is never modified.
 */
export async function backfillPageRootVersion(): Promise<PageRootVersionBackfillResult> {
  const pages = await db.page.findMany({
    orderBy: [{ rootId: "asc" }, { version: "asc" }],
  });

  const groups = new Map<string, Page[]>();
  for (const page of pages) {
    const rootId = page.rootId ?? page.id;
    const group = groups.get(rootId);
    if (group) {
      group.push(page);
    } else {
      groups.set(rootId, [page]);
    }
  }

  let rootsProcessed = 0;
  let versionsProcessed = 0;

  for (const [rootId, versions] of groups) {
    const ordered = [...versions].sort((a, b) => a.version - b.version);
    const current = ordered[ordered.length - 1];
    if (!current) continue;

    const published = ordered.filter(
      (version) => version.status === ContentStatus.PUBLISHED,
    );
    const live = pickLiveVersion(published);

    const firstPublishedAt =
      published.length > 0
        ? published
            .map((version) => version.firstPublishedAt)
            .filter((date): date is Date => date !== null)
            .sort((a, b) => a.getTime() - b.getTime())[0] ?? null
        : null;

    await db.$transaction(async (tx) => {
      await tx.pageRoot.upsert({
        where: { id: rootId },
        create: { id: rootId, slug: current.slug, firstPublishedAt },
        update: {},
      });

      await tx.pageVersion.createMany({
        data: ordered.map((version) => ({
          id: version.id,
          ...toPageVersionData(version),
          createdAt: version.createdAt,
          updatedAt: version.updatedAt,
        })),
        skipDuplicates: true,
      });

      await tx.pageRoot.updateMany({
        where: { id: rootId, currentVersionId: null },
        data: { currentVersionId: current.id },
      });

      if (live) {
        await tx.pageRoot.updateMany({
          where: { id: rootId, liveVersionId: null },
          data: { liveVersionId: live.id },
        });
      }
    });

    rootsProcessed += 1;
    versionsProcessed += ordered.length;
  }

  return { rootsProcessed, versionsProcessed };
}
