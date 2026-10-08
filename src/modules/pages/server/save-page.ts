import "server-only";

import { ContentStatus } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import { dehydratePuckForms } from "@/puck/utils/dehydrate-puck-forms";

import type { PageUpdateValues } from "../schemas";
import { INITIAL_PUCK_DATA } from "../constants";

import { PageError } from "./errors";
import { acquirePageRootLock } from "./lock-page-root";

/**
 * Persist an edit to the current revision of a Page root.
 *
 * - When the current revision is not live, it is updated in place: a draft
 *   stays a single row while the editor iterates.
 * - When the current revision is live, the edit forks a new `CHANGED` revision
 *   so the live site keeps serving the published version until the change is
 *   published.
 */
export async function savePageVersion(input: PageUpdateValues) {
  const { id, rootId } = input;

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

    const nextTitle = input.title ?? current.title;
    const nextSlug = input.slug ?? root.slug;
    const nextSeoId = input.seoId !== undefined ? input.seoId : current.seoId;
    const nextPuckData = resolvePuckData(input, current);

    if (root.liveVersionId === current.id) {
      const latest = await tx.pageVersion.aggregate({
        where: { rootId },
        _max: { version: true },
      });
      const nextVersionNumber = (latest._max.version ?? 0) + 1;

      const forked = await tx.pageVersion.create({
        data: {
          rootId,
          version: nextVersionNumber,
          status: ContentStatus.CHANGED,
          title: nextTitle,
          editorType: current.editorType,
          puckData: nextPuckData,
          seoId: nextSeoId,
          userId: current.userId,
          imageCoverId: current.imageCoverId,
        },
      });

      await tx.pageRoot.update({
        where: { id: rootId },
        data: { currentVersionId: forked.id, slug: nextSlug },
      });

      return { ...forked, slug: nextSlug };
    }

    const updated = await tx.pageVersion.update({
      where: { id: current.id },
      data: {
        title: nextTitle,
        puckData: nextPuckData,
        ...(input.seoId !== undefined ? { seoId: nextSeoId } : {}),
      },
    });

    if (nextSlug !== root.slug) {
      await tx.pageRoot.update({
        where: { id: rootId },
        data: { slug: nextSlug },
      });
    }

    return { ...updated, slug: nextSlug };
  });
}

function resolvePuckData(
  input: PageUpdateValues,
  current: { puckData: PrismaJson.PuckData | null },
): PrismaJson.PuckData {
  if (input.puckData != null) {
    return dehydratePuckForms(input.puckData);
  }

  if (current.puckData != null) {
    return current.puckData;
  }

  return INITIAL_PUCK_DATA;
}
