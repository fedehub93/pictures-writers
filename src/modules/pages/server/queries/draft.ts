import { db } from "@/shared/lib/db";

import { ContentStatus } from "@/generated/prisma";

import { hydratePuckForms } from "@/puck/utils/hydrate-puck-forms";

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

  const hydratedPage = {
    id: version.id,
    rootId: root.id,
    title: version.title,
    slug: root.slug,
    puckData: version.puckData
      ? await hydratePuckForms(version.puckData)
      : null,
    publishedAt: version.publishedAt,
    firstPublishedAt: root.firstPublishedAt,
    updatedAt: version.updatedAt,
    seo: version.seo,
  };

  return hydratedPage;
};

export type GetDraftPageBySlug = Awaited<ReturnType<typeof getDraftPageBySlug>>;
