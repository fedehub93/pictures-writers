import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { Language } from "@/generated/prisma";

export async function GET(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const languages = await db.language.findMany();

    return NextResponse.json(languages);
  } catch (error) {
    console.log("[LANGUAGES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let languages = [];
    if (values.languages && values.languages.length > 0) {
      languages = values.languages.map((v: Language) => ({
        ...v,
      }));
    }

    await updateLanguages({ languages: values.languages });

    return NextResponse.json({});
  } catch (error) {
    console.log("[LANGUAGES_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

async function updateLanguages({
  languages,
}: {
  languages: {
    id?: string;
    code: string;
    name: string;
  }[];
}) {
  return await db.$transaction(async (tx) => {
    const existingLanguages = await tx.language.findMany({
      select: { id: true },
    });

    const existingIds = new Set(existingLanguages.map((c) => c.id));
    const incomingIds = new Set(
      languages.filter((l) => l.id).map((l) => l.id as string)
    );

    // 2️⃣ Determina cosa creare, aggiornare, eliminare
    const toCreate = languages.filter((d) => !d.id);
    const toUpdate = languages.filter((d) => d.id && existingIds.has(d.id));
    const toDelete = existingLanguages.filter((d) => !incomingIds.has(d.id));

    // 3️⃣ Esegue operazioni nella transazione
    await Promise.all([
      // Creazione nuove languages
      ...toCreate.map((l) =>
        tx.language.create({
          data: { ...l },
        })
      ),

      // Aggiornamento delle languages esistenti
      ...toUpdate.map((l) =>
        tx.language.update({
          where: { id: l.id },
          data: { ...l },
        })
      ),

      // Eliminazione delle languages rimosse dal payload
      ...toDelete.map((l) => tx.language.delete({ where: { id: l.id } })),
    ]);
  });
}
