import { NextRequest, NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  props: { params: Promise<{ userId: string }> }
) {
  const params = await props.params;
  try {
    const { userId } = params;

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    return NextResponse.json(user);
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
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.log("[USER_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
