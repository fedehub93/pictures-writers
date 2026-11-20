import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { PERMISSIONS } from "@/shared/lib/authorization";
import {
  deleteOwnedFileObjects,
  reportOwnedFileCleanupFailures,
} from "@/modules/media/server/owned-file";
import { legacyUserUpdateSchema } from "@/modules/users/schemas";
import { AvatarFileError, claimAvatar } from "@/modules/users/server/avatar";
import { legacyUserSelect } from "@/modules/users/server/legacy-contract";

export async function GET(
  _req: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = params;
    const user = await authAdmin(PERMISSIONS.USERS_READ);

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const target = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: legacyUserSelect,
    });

    return NextResponse.json(target);
  } catch (error) {
    console.log("[GET_USER_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: RouteContext<"/api/users/[userId]">
) {
  try {
    const { userId } = await ctx.params;
    const user = await authAdmin(PERMISSIONS.USERS_UPDATE);

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const values = legacyUserUpdateSchema.parse(await req.json());

    const { updatedUser, previousAvatar } = await db.$transaction(
      async (transaction) => {
        const avatar =
          values.imageUrl === undefined
            ? null
            : await claimAvatar(transaction, userId, values.imageUrl);

        const updatedUser = await transaction.user.update({
          where: {
            id: userId,
          },
          data: {
            ...values,
            ...(avatar ? { imageUrl: avatar.imageUrl } : {}),
          },
          select: legacyUserSelect,
        });

        return { updatedUser, previousAvatar: avatar?.previous ?? null };
      },
    );

    if (previousAvatar) {
      reportOwnedFileCleanupFailures(
        { userId },
        await deleteOwnedFileObjects([previousAvatar]),
      );
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.log("[USER_ID]", error);
    if (error instanceof AvatarFileError) {
      return new NextResponse(error.message, { status: 400 });
    }
    if (error instanceof Error && error.name === "ZodError") {
      return new NextResponse("Invalid request", { status: 400 });
    }
    return new NextResponse("Internal Error", { status: 500 });
  }
}
