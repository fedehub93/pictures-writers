import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";

import { getPublishedProductByRootId } from "@/data/product";

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
    
    console.log("ciao")
    const product = await getPublishedProductByRootId(rootId);


    return NextResponse.json(product);
  } catch (error) {
    console.log("[PRODUCTS_ROOT_ID_VERSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
