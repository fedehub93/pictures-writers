import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

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

    await updateContestPrices({
      contestId: contest.id,
      prices: values.prices,
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.log("[CONTESTS_ROOT_ID_VERSIONS_CONTEST_ID_PRICES_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function updateContestPrices({
  contestId,
  prices,
}: {
  contestId: string;
  prices: {
    id?: string;
    deadlineId: string;
    categoryId: string;
    price: number;
  }[];
}) {
  return await db.$transaction(async (tx) => {
    // 1️⃣ Recupera le prices esistenti per il contest
    const existingPrices = await tx.contestPrice.findMany({
      where: { contestId },
      select: { id: true },
    });

    const existingIds = new Set(existingPrices.map((p) => p.id));
    const incomingIds = new Set(
      prices.filter((p) => p.id).map((p) => p.id as string)
    );

    // 2️⃣ Determina cosa creare, aggiornare, eliminare
    const toCreate = prices.filter((d) => !d.id);
    const toUpdate = prices.filter((d) => d.id && existingIds.has(d.id));
    const toDelete = existingPrices.filter((d) => !incomingIds.has(d.id));

    // 3️⃣ Esegue operazioni nella transazione
    await Promise.all([
      // Creazione nuove prices
      ...toCreate.map((p) =>
        tx.contestPrice.create({
          data: { ...p, contestId },
        })
      ),

      // Aggiornamento delle prices esistenti
      ...toUpdate.map((p) =>
        tx.contestPrice.update({
          where: { id: p.id },
          data: { price: p.price },
        })
      ),

      // Eliminazione delle prices rimosse dal payload
      ...toDelete.map((p) => tx.contestPrice.delete({ where: { id: p.id } })),
    ]);
  });
}
