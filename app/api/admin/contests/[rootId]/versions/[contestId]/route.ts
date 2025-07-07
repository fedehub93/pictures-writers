import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { disconnect } from "process";

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
      contestId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, contestId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedContest = await db.contest.deleteMany({
      where: { rootId },
    });

    // if (contest.seoId) {
    //   await db.seo.delete({
    //     where: { id: contest.seoId },
    //   });
    // }

    return NextResponse.json(deletedContest);
  } catch (error) {
    console.log("[CONTESTS_ROOT_ID_VERSIONS_CONTEST_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  props: {
    params: Promise<{
      rootId: string;
      contestId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId, contestId } = params;

    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await db.contest.findUnique({ where: { id: contestId } });

    if (!contest) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const updatedContest = await db.contest.update({
      where: { id: contest.id },
      data: {
        ...values,
        translation: undefined,
        translations: undefined,
        deadlines: undefined,
        categories: undefined,
        stages: undefined,
        updatedAt: new Date(),
      },
    });

    if (updatedContest) {
      if (values.translation) {
        await updateContestTranslation({
          contestId: updatedContest.id,
          translation: values.translation,
        });
      }

      if (values.deadlines) {
        await updateContestDeadlines({
          contestId: updatedContest.id,
          deadlines: values.deadlines,
        });
      }

      if (values.categories) {
        await updateContestCategories({
          contestId: updatedContest.id,
          categories: values.categories,
        });
      }

      if (values.stages) {
        await updateContestStages({
          contestId: updatedContest.id,
          stages: values.stages,
        });
      }
    }

    return NextResponse.json(updatedContest);
  } catch (error) {
    console.log("[CONTESTS_ROOT_ID_VERSIONS_CONTEST_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function updateContestTranslation({
  contestId,
  translation,
}: {
  contestId: string;
  translation: {
    id?: string;
    languageId: string;
    name: string;
    slug: string;
    shortDescription: string | null;
    description: PrismaJson.BodyData;
    benefits: PrismaJson.BodyData;
    rules: PrismaJson.BodyData;
  };
}) {
  return await db.$transaction(async (tx) => {
    // 1️⃣ Recupera le deadlines esistenti per il contest
    const existingTranslation = await tx.contestTranslations.findFirst({
      where: {
        contestId,
        languageId: translation.languageId,
      },
      select: { id: true },
    });

    let updatedTranslation = null;

    if (existingTranslation) {
      updatedTranslation = await tx.contestTranslations.update({
        where: {
          id: existingTranslation.id,
        },
        data: {
          ...translation,
        },
      });
    }

    if (!existingTranslation) {
      updatedTranslation = await tx.contestTranslations.create({
        data: {
          contestId,
          ...translation,
        },
      });
    }

    return updatedTranslation;
  });
}

async function updateContestDeadlines({
  contestId,
  deadlines,
}: {
  contestId: string;
  deadlines: {
    id?: string;
    name: string;
    date: Date;
  }[];
}) {
  return await db.$transaction(async (tx) => {
    // 1️⃣ Recupera le deadlines esistenti per il contest
    const existingDeadlines = await tx.contestDeadline.findMany({
      where: { contestId },
      select: { id: true },
    });

    const existingIds = new Set(existingDeadlines.map((d) => d.id));
    const incomingIds = new Set(
      deadlines.filter((d) => d.id).map((d) => d.id as string)
    );

    // 2️⃣ Determina cosa creare, aggiornare, eliminare
    const toCreate = deadlines.filter((d) => !d.id);
    const toUpdate = deadlines.filter((d) => d.id && existingIds.has(d.id));
    const toDelete = existingDeadlines.filter((d) => !incomingIds.has(d.id));

    // 3️⃣ Esegue operazioni nella transazione
    await Promise.all([
      // Creazione nuove deadlines
      ...toCreate.map((d) =>
        tx.contestDeadline.create({
          data: { ...d, contestId },
        })
      ),

      // Aggiornamento delle deadlines esistenti
      ...toUpdate.map((d) =>
        tx.contestDeadline.update({
          where: { id: d.id },
          data: { date: d.date, name: d.name },
        })
      ),

      // Eliminazione delle deadlines rimosse dal payload
      ...toDelete.map((d) =>
        tx.contestDeadline.delete({ where: { id: d.id } })
      ),
    ]);
  });
}

async function updateContestCategories({
  contestId,
  categories,
}: {
  contestId: string;
  categories: {
    id?: string;
    name: string;
  }[];
}) {
  return await db.$transaction(async (tx) => {
    // 1️⃣ Recupera le categories esistenti per il contest
    const existingCategories = await tx.contestCategory.findMany({
      where: { contestId },
      select: { id: true },
    });

    const existingIds = new Set(existingCategories.map((c) => c.id));
    const incomingIds = new Set(
      categories.filter((c) => c.id).map((c) => c.id as string)
    );

    // 2️⃣ Determina cosa creare, aggiornare, eliminare
    const toCreate = categories.filter((d) => !d.id);
    const toUpdate = categories.filter((d) => d.id && existingIds.has(d.id));
    const toDelete = existingCategories.filter((d) => !incomingIds.has(d.id));

    // 3️⃣ Esegue operazioni nella transazione
    await Promise.all([
      // Creazione nuove categories
      ...toCreate.map((c) =>
        tx.contestCategory.create({
          data: { ...c, contestId },
        })
      ),

      // Aggiornamento delle categories esistenti
      ...toUpdate.map((c) =>
        tx.contestCategory.update({
          where: { id: c.id },
          data: { name: c.name },
        })
      ),

      // Eliminazione delle categories rimosse dal payload
      ...toDelete.map((c) =>
        tx.contestCategory.delete({ where: { id: c.id } })
      ),
    ]);
  });
}

async function updateContestStages({
  contestId,
  stages,
}: {
  contestId: string;
  stages: {
    id?: string;
    name: string;
    date: Date;
  }[];
}) {
  return await db.$transaction(async (tx) => {
    // 1️⃣ Recupera le stages esistenti per il contest
    const existingStages = await tx.contestSelectionStage.findMany({
      where: { contestId },
      select: { id: true },
    });

    const existingIds = new Set(existingStages.map((d) => d.id));
    const incomingIds = new Set(
      stages.filter((d) => d.id).map((d) => d.id as string)
    );

    // 2️⃣ Determina cosa creare, aggiornare, eliminare
    const toCreate = stages.filter((d) => !d.id);
    const toUpdate = stages.filter((d) => d.id && existingIds.has(d.id));
    const toDelete = existingStages.filter((d) => !incomingIds.has(d.id));

    // 3️⃣ Esegue operazioni nella transazione
    await Promise.all([
      // Creazione nuove stages
      ...toCreate.map((d) =>
        tx.contestSelectionStage.create({
          data: { ...d, contestId },
        })
      ),

      // Aggiornamento delle deadlines esistenti
      ...toUpdate.map((d) =>
        tx.contestSelectionStage.update({
          where: { id: d.id },
          data: { date: d.date, name: d.name },
        })
      ),

      // Eliminazione delle deadlines rimosse dal payload
      ...toDelete.map((d) =>
        tx.contestSelectionStage.delete({ where: { id: d.id } })
      ),
    ]);
  });
}
