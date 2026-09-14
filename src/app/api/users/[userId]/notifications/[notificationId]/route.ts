import { NextResponse } from "next/server";

import { auth } from "@/shared/lib/auth";
import { getAuthorizedUser } from "@/shared/lib/authorization";
import { db } from "@/lib/db";
import { headers } from "next/headers";

export async function PATCH(
  _req: Request,
  props: { params: Promise<{ userId: string; notificationId: string }> }
) {
  const params = await props.params;
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const user = session ? await getAuthorizedUser(session.id) : null;
    const { userId, notificationId } = params;

    if (!user || user.id !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const notification = await db.notification.findFirst({
      where: { id: notificationId, userId: user.id },
      select: { id: true },
    });

    if (!notification) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const updatedUser = await db.notification.update({
      where: { id: notification.id },
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
