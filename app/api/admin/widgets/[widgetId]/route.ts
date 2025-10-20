import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { triggerWebhookBuild } from "@/lib/vercel";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ widgetId: string }> }
) {
  const params = await props.params;
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

    if (process.env.NODE_ENV === "production" && updatedWidget) {
      await triggerWebhookBuild();
    }

    return NextResponse.json(updatedWidget);
  } catch (error) {
    console.log("[WIDGET_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      widgetId: string;
    }>;
  }
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { widgetId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const widget = await db.widget.findUnique({
      where: { id: widgetId },
    });

    if (!widget) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedWidget = await db.widget.deleteMany({
      where: { id: widgetId },
    });

    return NextResponse.json(deletedWidget);
  } catch (error) {
    console.log("[WIDGET_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
