import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = params;

    // 1. Estrai i query parameters dalla URL della richiesta
    const { searchParams } = new URL(req.url);

    const interactionsRaw = searchParams.get("interactions");

    // Converte "click,view" in ["click", "view"] e pulisce eventuali spazi vuoti
    const interactions = interactionsRaw
      ? interactionsRaw
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    // 1. Recupera il segmento e i contatti dal tuo DB
    const result = await db.emailContact.count({
      where: {
        audiences: {
          none: {
            id,
          },
        },
        interactions: {
          some: {
            interactionType: { in: [...interactions] },
          },
        },
      },
    });

    return NextResponse.json({
      totalContacts: result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
