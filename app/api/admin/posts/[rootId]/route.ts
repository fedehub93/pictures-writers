import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { getPublishedPostByRootId } from "@/lib/post";

export async function GET(
  req: Request,
  props: { params: Promise<{ rootId: string }> }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const post = await getPublishedPostByRootId(rootId);

    return NextResponse.json(post);
  } catch (error) {
    console.log("[ADMIN_POSTS_ROOT_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
