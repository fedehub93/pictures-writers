import { NextResponse } from "next/server";

import { syncAudienceWithProvider } from "@/modules/mails/lib/core";
import { authAdmin } from "@/lib/auth-service";

export const maxDuration = 60;

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;

  try {
    const user = await authAdmin();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    const { id: audienceId } = params;

    const { skip, take } = await req.json();

    // 1. Recupera il segmento e i contatti dal tuo DB
    const result = await syncAudienceWithProvider(
      audienceId,
      Number(skip),
      Number(take),
    );

    return NextResponse.json({
      message: "Sync successfully",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
