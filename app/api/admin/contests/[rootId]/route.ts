import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { getPublishedContestByRootId } from "@/data/contest";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ rootId: string }> }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId } = params;
    const searchParams = req.nextUrl.searchParams;
    const langId = searchParams.get("langId");

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contest = await getPublishedContestByRootId(rootId, langId);

    return NextResponse.json(contest);
  } catch (error) {
    console.log("[CONTESTS_ROOT_ID_VERSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
