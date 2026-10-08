import "server-only";

import { ContentStatus, PageEditorType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";

import type { PageInsertValues } from "../schemas";
import { INITIAL_PUCK_DATA } from "../constants";

import { createPageVersionSeo } from "./page-seo";

export interface CreatePageInput extends PageInsertValues {
  userId: string;
}

/**
 * Create a logical page: a `PageRoot` owning the slug plus its first `DRAFT`
 * `PageVersion`. The version gets a self-owned SEO row and immediately becomes
 * the root's current version.
 */
export async function createPage({ title, slug, userId }: CreatePageInput) {
  return db.$transaction(async (tx) => {
    const root = await tx.pageRoot.create({ data: { slug } });

    const version = await tx.pageVersion.create({
      data: {
        rootId: root.id,
        version: 1,
        status: ContentStatus.DRAFT,
        title,
        editorType: PageEditorType.PUCK,
        puckData: INITIAL_PUCK_DATA,
        userId,
      },
    });

    const seo = await createPageVersionSeo(tx, title, {
      noIndex: false,
      noFollow: false,
    });

    const versionWithSeo = await tx.pageVersion.update({
      where: { id: version.id },
      data: { seoId: seo.id },
    });

    await tx.pageRoot.update({
      where: { id: root.id },
      data: { currentVersionId: version.id },
    });

    return { ...versionWithSeo, slug: root.slug, rootId: root.id };
  });
}
