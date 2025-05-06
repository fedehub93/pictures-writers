import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function GET(
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
    const searchParams = req.nextUrl.searchParams;

    const langId = searchParams.get("langId");
    
    const contest = await db.contest.findFirst({
      where: {
        rootId,
        languageId: langId,
      },
    });

    return NextResponse.json(contest);
  } catch (error) {
    console.log("[CONTESTS_ROOT_ID_CHECK_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
