import "server-only";

import { ContentStatus, Prisma, type PageVersion, type Seo } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { PageUpdateSeoValues } from "../schemas";

import { PageError } from "./errors";
import { acquirePageRootLock } from "./lock-page-root";
import {
  clonePageSeo,
  createPageVersionSeo,
  type PageSeoOverrides,
} from "./page-seo";

/**
 * Apply an SEO edit to the current revision of a Page root.
 *
 * - A non-live current revision is updated in place, so editing SEO on a draft
 *   does not spawn a new content revision.
 * - A live current revision is forked into a new `CHANGED` revision carrying a
 *   cloned SEO row, so the live site keeps serving the old metadata until the
 *   staged revision is published.
 * - If the current revision's SEO is shared with another revision (older data
 *   or a content fork), the SEO is cloned before editing so the edit cannot
 *   leak into the version it was shared with.
 *
 * The `PageRoot` is locked for the duration so a concurrent publish cannot
 * interleave between reading the live pointer and forking.
 */
export async function updatePageVersionSeo(
  input: PageUpdateSeoValues,
): Promise<Seo> {
  const { id, rootId, ...overrides } = input;

  return db.$transaction(async (tx) => {
    await acquirePageRootLock(tx, rootId);

    const root = await tx.pageRoot.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new PageError("NOT_FOUND", "Page not found");
    }

    const current = await tx.pageVersion.findFirst({ where: { id, rootId } });
    if (!current) {
      throw new PageError("NOT_FOUND", "Page not found");
    }

    if (root.liveVersionId === current.id) {
      return forkVersionWithSeo(tx, root.id, current, overrides);
    }

    const sharedWithAnotherVersion = current.seoId
      ? await tx.pageVersion.count({
          where: { seoId: current.seoId, id: { not: current.id } },
        })
      : 0;

    if (current.seoId && sharedWithAnotherVersion === 0) {
      return tx.seo.update({
        where: { id: current.seoId },
        data: overrides,
      });
    }

    const seo = await resolveSeo(tx, current, overrides);

    await tx.pageVersion.update({
      where: { id: current.id },
      data: { seoId: seo.id },
    });

    return seo;
  });
}

/**
 * Clone the version's SEO (or create one when it has none). A missing SEO can
 * only be transient, but the helper keeps the fork and clone paths uniform.
 */
async function resolveSeo(
  tx: Prisma.TransactionClient,
  current: PageVersion,
  overrides: PageSeoOverrides,
): Promise<Seo> {
  const seo = current.seoId
    ? await clonePageSeo(tx, current.seoId, overrides)
    : await createPageVersionSeo(tx, current.title, overrides);

  if (!seo) {
    throw new PageError("NOT_FOUND", "Page not found");
  }

  return seo;
}

/**
 * Create a new `CHANGED` revision for a live page so an SEO edit can be staged
 * without touching the live revision. The revision carries a clone of the live
 * SEO, so publishing it later promotes the edited metadata atomically.
 */
async function forkVersionWithSeo(
  tx: Prisma.TransactionClient,
  rootId: string,
  current: PageVersion,
  overrides: PageSeoOverrides,
): Promise<Seo> {
  const latest = await tx.pageVersion.aggregate({
    where: { rootId },
    _max: { version: true },
  });

  const seo = await resolveSeo(tx, current, overrides);

  const forked = await tx.pageVersion.create({
    data: {
      rootId,
      version: (latest._max.version ?? 0) + 1,
      status: ContentStatus.CHANGED,
      title: current.title,
      editorType: current.editorType,
      puckData: current.puckData ?? undefined,
      seoId: seo.id,
      userId: current.userId,
      imageCoverId: current.imageCoverId,
    },
  });

  await tx.pageRoot.update({
    where: { id: rootId },
    data: { currentVersionId: forked.id },
  });

  return seo;
}
