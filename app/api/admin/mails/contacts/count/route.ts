import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function GET(req: Request) {
  try {
    const user = await authAdmin();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Estrai i query parameters dalla URL della richiesta
    const { searchParams } = new URL(req.url);
    const audienceId = searchParams.get("audienceId");

    // 1. Recupera il segmento e i contatti dal tuo DB
    const result = await db.emailContact.count({
      where: {
        audiences: audienceId
          ? {
              none: {
                id: audienceId,
              },
            }
          : undefined,
      },
    });

    return NextResponse.json({
      totalContacts: result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
