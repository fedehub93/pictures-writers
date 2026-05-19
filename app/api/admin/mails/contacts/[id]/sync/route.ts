import { NextResponse } from "next/server";

import { syncContactWithProvider } from "@/lib/mail/core";
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
    const { id } = params;

    // 1. Sync with the provider
    const result = await syncContactWithProvider(id);

    return NextResponse.json({
      message: "Sync successfully",
      ...result,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
