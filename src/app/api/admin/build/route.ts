import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { triggerWebhookBuild } from "@/lib/vercel";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (process.env.NODE_ENV === "production") {
      await triggerWebhookBuild();
    }

    return NextResponse.json({ status: true });
  } catch (error) {
    console.log("[BUILD_WEBSITE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
