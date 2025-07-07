import { ContentStatus } from "@prisma/client";
import { db } from "./db";
import { getSelectedOrDefaultWhere } from "@/data/language";

export const createNewVersionContest = async (
  rootId: string,
  langId: string | null,
  values: any
) => {
  // Trovo ultima versione pubblicata
  const publishedContest = await db.contest.findFirst({
    where: {
      rootId,
      ...getSelectedOrDefaultWhere,
      status: ContentStatus.PUBLISHED,
      isLatest: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (!publishedContest) {
    return { message: "Contest not found", status: 404, contest: null };
  }

  // Creo nuova versione
  const contest = await db.contest.create({
    data: {
      name: values.name || publishedContest.name,
      description: values.description || publishedContest.description,
      slug: values.slug || publishedContest.slug,
      organizationId: values.organizationId || publishedContest.organizationId,
      version: publishedContest.version + 1,
      status: ContentStatus.CHANGED,
      isLatest: false,
    },
  });

  const updatedContest = await db.contest.update({
    where: { id: contest.id },
    data: {
      ...publishedContest,
      ...values,
      id: undefined,
      version: undefined,
      status: undefined,
      isLatest: undefined,
      seo: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      publishedAt: undefined,
    },
  });

  // if (updatedContest.seoId && values.seo) {
  //   await db.seo.update({
  //     where: { id: updatedContest.seoId },
  //     data: { ...values.seo },
  //   });
  // }

  return { message: "", status: 200, product: updatedContest };
};
