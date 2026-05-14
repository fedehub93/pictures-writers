import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { createNewVersionPage } from "@/lib/page";

export async function POST(
  req: Request,
  props: { params: Promise<{ rootId: string }> },
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await createNewVersionPage(rootId, values);
    if (result.status !== 200) {
      return new NextResponse(result.message, { status: result.status });
    }

    return NextResponse.json(result.page);
  } catch (error) {
    console.log("[PAGES_ROOT_ID_VERSIONS_PAGE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
