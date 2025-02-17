import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(req: Request, props: { params: Promise<{ templateId: string }> }) {
  const params = await props.params;
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

export async function PATCH(req: Request, props: { params: Promise<{ templateId: string }> }) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { templateId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const template = await db.emailTemplate.update({
      where: {
        id: templateId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.log("[EMAIL_TEMPLATE_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
