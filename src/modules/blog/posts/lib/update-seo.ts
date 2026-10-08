import "server-only";

import { Prisma, type Seo } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { PostUpdateSeoValues } from "../schemas";

import { PostError } from "./errors";
import { acquireRootLock } from "./lock-root-posts";
import {
  clonePostSeo,
  createPostVersionSeo,
  type PostSeoOverrides,
} from "./post-seo";
import { forkPostVersion, type CurrentVersion } from "./save-post";

/**
 * Apply an SEO edit to the current revision of a Post root.
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
 * The `PostRoot` is locked for the duration so a concurrent publish cannot
 * interleave between reading the live pointer and forking.
 */
export async function updatePostVersionSeo(
  input: PostUpdateSeoValues,
): Promise<Seo> {
  const { id, rootId, ...overrides } = input;

  return db.$transaction(async (tx) => {
    await acquireRootLock(tx, rootId);

    const root = await tx.postRoot.findUnique({ where: { id: rootId } });
    if (!root) {
      throw new PostError("NOT_FOUND", "Post not found");
    }

    const current = await tx.postVersion.findFirst({
      where: { id, rootId },
      include: { categories: true, tags: true, authors: true, faqs: true },
    });
    if (!current) {
      throw new PostError("NOT_FOUND", "Post not found");
    }

    if (root.liveVersionId === current.id) {
      const seo = await resolveSeo(tx, current, overrides);
      if (!seo) {
        throw new PostError("NOT_FOUND", "Post not found");
      }

      await forkPostVersion(tx, {
        root,
        current,
        input: { id, rootId },
        title: current.title,
        slug: root.slug,
        seoId: seo.id,
      });

      return seo;
    }

    const sharedWithAnotherVersion = current.seoId
      ? await tx.postVersion.count({
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
    if (!seo) {
      throw new PostError("NOT_FOUND", "Post not found");
    }

    await tx.postVersion.update({
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
  current: CurrentVersion,
  overrides: PostSeoOverrides,
): Promise<Seo | null> {
  return current.seoId
    ? clonePostSeo(tx, current.seoId, overrides)
    : createPostVersionSeo(tx, current.title, overrides, current.imageCoverId);
}
