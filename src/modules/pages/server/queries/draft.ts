import { db } from "@/shared/lib/db";

import { ContentStatus } from "@/generated/prisma";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

import { resolveSmartLinksInPuckData } from "@/modules/site-regions/server/resolve-link";

const DRAFT_STATUSES = [ContentStatus.DRAFT, ContentStatus.CHANGED];

export const getPublishedDraftPagesBuilding = async () => {
  const roots = await db.pageRoot.findMany({
    where: {
      currentVersion: { is: { status: { in: DRAFT_STATUSES } } },
    },
    select: {
      id: true,
      slug: true,
      currentVersion: {
        select: {
          id: true,
        },
      },
    },
    orderBy: {
      firstPublishedAt: "desc",
    },
  });

  return roots.map((root) => ({
    id: root.currentVersion!.id,
    rootId: root.id,
    slug: root.slug,
  }));
};

export const getDraftPageBySlug = async (slug: string) => {
  const root = await db.pageRoot.findFirst({
    where: {
      slug,
      currentVersion: { is: { status: { in: DRAFT_STATUSES } } },
    },
    include: {
      currentVersion: {
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

  if (!root || !root.currentVersion) return null;

  const version = root.currentVersion;

  const hydratedPuckData = version.puckData
    ? await hydratePuckForms(version.puckData)
    : null;

  const hydratedPage = {
    id: version.id,
    rootId: root.id,
    title: version.title,
    slug: root.slug,
    // The preview predicts publication: forms are hydrated and Smart links are
    // resolved against their live targets, exactly as the published read does.
    // The stored draft document keeps the raw Smart links.
    puckData: hydratedPuckData
      ? await resolveSmartLinksInPuckData(hydratedPuckData)
      : null,
    publishedAt: version.publishedAt,
    firstPublishedAt: root.firstPublishedAt,
    updatedAt: version.updatedAt,
    seo: version.seo,
  };

  return hydratedPage;
};

export type GetDraftPageBySlug = Awaited<ReturnType<typeof getDraftPageBySlug>>;
