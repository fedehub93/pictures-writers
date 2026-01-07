import { NextResponse } from "next/server";

import { Notification } from "@/prisma/generated/client";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

const NOTIFICATION_BATCH = 5;

export async function GET(
  req: Request,
  props: { params: Promise<{ userId: string }> }
) {
  try {
    const params = await props.params;
    const user = await authAdmin();

    const { userId } = params;

    if (!user || user.id !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const cursor = searchParams.get("cursor");
    const page = Number(searchParams.get("page")) || 1;

    let notifications: Notification[] = [];
    let totalNotifications = 0;
    let nextCursor: string | null = null;

    if (cursor) {
      notifications = await db.notification.findMany({
        where: {
          userId: user.id,
          isRead: false,
        },
        take: NOTIFICATION_BATCH,
        skip: 1,
        cursor: { id: cursor },
        orderBy: {
          createdAt: "desc",
        },
      });

      let nextCursor = null;

      if (notifications.length === NOTIFICATION_BATCH) {
        nextCursor = notifications[NOTIFICATION_BATCH - 1].id;
      }

      totalNotifications = await db.notification.count({
        where: {
          userId: user.id,
          isRead: false,
        },
      });
    } else {
      const skip = (page - 1) * NOTIFICATION_BATCH;
      const take = NOTIFICATION_BATCH;

      const [foundNotifications, count] = await db.$transaction([
        db.notification.findMany({
          where: {
            userId: user.id,
            isRead: false,
          },
          take,
          skip,
          orderBy: {
            createdAt: "desc",
          },
        }),
        db.notification.count({
          where: {
            userId: user.id,
            isRead: false,
          },
        }),
      ]);

      notifications = foundNotifications;
      totalNotifications = count;

      if (notifications.length === NOTIFICATION_BATCH) {
        nextCursor = notifications[NOTIFICATION_BATCH - 1].id;
      }
    }

    const pagination = {
      page,
      perPage: NOTIFICATION_BATCH,
      totalRecords: totalNotifications,
      totalPages: Math.ceil(totalNotifications / NOTIFICATION_BATCH),
    };

    return NextResponse.json({ items: notifications, pagination, nextCursor });
  } catch (error) {
    return NextResponse.json(
      { error: "Errore nel conteggio delle notifiche." },
      { status: 500 }
    );
  }
}
