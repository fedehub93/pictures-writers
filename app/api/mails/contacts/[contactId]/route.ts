import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";
import { AudienceType } from "@prisma/client";

export async function DELETE(
  req: Request,
  { params }: { params: { contactId: string } }
) {
  try {
    const user = await authAdmin();
    const { contactId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const emailTemplate = await db.emailTemplate.findUnique({
      where: {
        id: params.contactId,
      },
    });

    if (!emailTemplate) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deleteEmailTemplate = await db.emailTemplate.delete({
      where: { id: contactId },
    });

    return NextResponse.json(deleteEmailTemplate);
  } catch (error) {
    console.log("[EMAIL_TEMPLATE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { contactId: string } }
) {
  try {
    const user = await authAdmin();
    const { contactId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const audiences: { label: string; value: string }[] = values.audiences
      ? [...values.audiences]
      : [];

    const template = await db.emailContact.update({
      where: {
        id: contactId,
      },
      data: {
        ...values,
        audiences: values.audiences
          ? {
              set: audiences.map((audience) => ({
                id: audience.value,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.log("[EMAIL_CONTACT_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
