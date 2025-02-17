import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { widgets } = await req.json();

    for (let item of widgets) {
      await db.widget.update({
        where: { id: item.id },
        data: { sort: item.sort },
      });
    }

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.log("[WIDGETS_REORDER]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
