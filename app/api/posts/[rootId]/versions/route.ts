import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { createNewVersionPost } from "@/lib/post";

export async function POST(
  req: Request,
  { params }: { params: { rootId: string } }
) {
  try {
    const user = await authAdmin();
    const { rootId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await createNewVersionPost(rootId, values);
    if (result.status !== 200) {
      return new NextResponse(result.message, { status: result.status });
    }

    return NextResponse.json(result.post);
  } catch (error) {
    console.log("[POSTS_ROOT_ID_VERSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
