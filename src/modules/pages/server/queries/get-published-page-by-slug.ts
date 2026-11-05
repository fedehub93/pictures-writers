import { db } from "@/shared/lib/db";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

import { resolveSmartLinksInPuckData } from "@/modules/site-regions/server/resolve-link";

/**
 *
 * @param slug Get Published Page By Slug
 * @returns
 */

export const getPublishedPageBySlug = async (slug: string) => {
  const root = await db.pageRoot.findUnique({
    where: {
      slug,
    },
    include: {
      liveVersion: {
        include: {
          seo: {
            select: {
              title: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!root || !root.liveVersion) return null;

  const version = root.liveVersion;

  const puckData = version.puckData
    ? await hydratePuckForms(version.puckData)
    : null;

  const hydratedPage = {
    id: version.id,
    rootId: root.id,
    title: version.title,
    slug: root.slug,
    editorType: version.editorType,
    // Links stored as SmartLink props are resolved for the public renderer.
    // Admin queries (`getOne`, `getLastByRootId`) keep the raw document.
    puckData: puckData ? await resolveSmartLinksInPuckData(puckData) : null,
    firstPublishedAt: root.firstPublishedAt,
    updatedAt: version.updatedAt,
    seo: version.seo,
  };

  return hydratedPage;
};

export type GetPublishedPageBySlug = Awaited<
  ReturnType<typeof getPublishedPageBySlug>
>;
