import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { createNewVersionContest } from "@/lib/contest";

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
    const searchParams = req.nextUrl.searchParams;
    const langId = searchParams.get("langId");

    const values = await req.json();

    const result = await createNewVersionContest(rootId, langId, values);
    if (result.status !== 200) {
      return new NextResponse(result.message, { status: result.status });
    }

    return NextResponse.json(result.contest);
  } catch (error) {
    console.log("[CONTESTS_ROOT_ID_VERSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
