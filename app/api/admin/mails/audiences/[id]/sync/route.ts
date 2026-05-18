import { NextResponse } from "next/server";

import { syncAudienceWithProvider } from "@/lib/mail/core";
import { authAdmin } from "@/lib/auth-service";

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
    // 1. Recupera il segmento e i contatti dal tuo DB
    const result = await syncAudienceWithProvider(audienceId);

    return NextResponse.json({
      message: "Sync successfully",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
