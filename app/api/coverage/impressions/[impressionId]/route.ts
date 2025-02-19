import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      impressionId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { impressionId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const deletedImpression = await db.impression.delete({
      where: {
        id: impressionId,
      },
    });

    return NextResponse.json(deletedImpression);
  } catch (error) {
    console.log("[COVERAGE_IMPRESSION_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
