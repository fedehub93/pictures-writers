import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ rootId: string }> }
) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const params = await props.params;
    const { rootId } = params;

    const { contestId, langId } = await req.json();

    if (!contestId || !langId) {
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 }
      );
    }

    // Controlla se il contest esiste già
    const existingContest = await db.contest.findFirst({
      where: {
        id: contestId,
        rootId,
        languageId: langId,
      },
    });

    if (existingContest) {
      return NextResponse.json(
        { error: "Contest already exists" },
        { status: 400 }
      );
    }

    // Creiamo il nuovo contest nella nuova lingua, copiando i dati base dalla versione di default
    const defaultContest = await db.contest.findFirst({
      where: {
        id: contestId,
        rootId,
        OR: [
          { languageId: null }, // Contest senza lingua
          { language: { isDefault: true } }, // Contest nella lingua di default
        ],
      },
      include: {
        categories: true,
        deadlines: true,
        prices: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!defaultContest) {
      return NextResponse.json(
        { error: "Default contest not found" },
        { status: 404 }
      );
    }

    const newContest = await db.contest.create({
      data: {
        rootId: rootId,
        languageId: langId,
        organizationId: defaultContest.organizationId,
        name: defaultContest.name, // Potresti tradurre il titolo in seguito
        slug: defaultContest.slug, // Potresti tradurre lo slug in seguito
        version: 1,
        description: defaultContest.description,
        imageCoverId: defaultContest.imageCoverId,
        categories: undefined,
        deadlines: undefined,
        prices: undefined,
      },
    });

    return NextResponse.json({ newContest });
  } catch (error) {
    console.log("[CONTESTS_ROOT_ID_TRANSLATIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
