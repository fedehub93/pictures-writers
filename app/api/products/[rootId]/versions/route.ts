import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { createNewVersionProduct } from "@/lib/product";
import { db } from "@/lib/db";
import { getPublishedProductByRootId } from "@/data/product";

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

    const result = await createNewVersionProduct(rootId, values);
    if (result.status !== 200) {
      return new NextResponse(result.message, { status: result.status });
    }

    return NextResponse.json(result.product);
  } catch (error) {
    console.log("[PRODUCTS_ROOT_ID_VERSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
