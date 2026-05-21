import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { id } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const emailContact = await db.emailAudience.findUnique({
      where: {
        id: id,
      },
    });

    if (!emailContact) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deleteEmailContact = await db.emailAudience.delete({
      where: { id: id },
    });

    return NextResponse.json(deleteEmailContact);
  } catch (error) {
    console.log("[EMAIL_AUDIENCE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { id } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contact = await db.emailAudience.update({
      where: {
        id: id,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.log("[EMAIL_AUDIENCE_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
