import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function PATCH(
  req: Request,
  { params }: { params: { widgetId: string } }
) {
  try {
    const user = await authAdmin();
    const { widgetId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedWidget = await db.widget.update({
      where: {
        id: widgetId,
      },
      data: {
        ...values,
        section: undefined,
        type: undefined,
      },
    });

    return NextResponse.json(updatedWidget);
  } catch (error) {
    console.log("[WIDGET_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
