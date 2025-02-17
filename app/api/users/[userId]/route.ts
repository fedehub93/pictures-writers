import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(
  req: Request,
  { params }: { params: { templateId: string } }
) {
  try {
    const user = await authAdmin();
    const { templateId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const emailTemplate = await db.emailTemplate.findUnique({
      where: {
        id: params.templateId,
      },
    });

    if (!emailTemplate) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deleteEmailTemplate = await db.emailTemplate.delete({
      where: { id: templateId },
    });

    return NextResponse.json(deleteEmailTemplate);
  } catch (error) {
    console.log("[EMAIL_TEMPLATE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const user = await db.user.findFirst({
      where: {
        externalUserId: userId,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.log("[GET_USER_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const user = await authAdmin();
    const { userId } = params;
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
