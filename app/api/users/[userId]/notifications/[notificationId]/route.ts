import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string; notificationId: string } }
) {
  try {
    const user = await authAdmin();
    const { userId, notificationId } = params;
    const values = await req.json();

    if (!user || user.id !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedUser = await db.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.log("[USER_NOTIFICATION_PATCH_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
