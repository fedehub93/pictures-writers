import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { revalidateContent } from "@/shared/lib/revalidate-content";

export async function POST(_req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Emergency "revalidate everything" — replaces the old full Vercel rebuild.
    // Revalidates root layout (navbar/footer/global) and sitemap.
    revalidateContent("all");

    return NextResponse.json({ status: true });
  } catch (error) {
    console.log("[BUILD_WEBSITE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
