import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { createNewVersionCategory } from "@/lib/category";

export async function POST(req: Request, props: { params: Promise<{ rootId: string }> }) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { rootId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const result = await createNewVersionCategory(rootId, values);
    if (result.status !== 200) {
      return new NextResponse(result.message, { status: result.status });
    }

    return NextResponse.json(result.category);
  } catch (error) {
    console.log("[CATEGORIES_ROOT_ID_VERSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
