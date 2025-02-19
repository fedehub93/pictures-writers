import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(req: Request, props: { params: Promise<{ audienceId: string }> }) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { audienceId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const emailContact = await db.emailAudience.findUnique({
      where: {
        id: audienceId,
      },
    });

    if (!emailContact) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deleteEmailContact = await db.emailAudience.delete({
      where: { id: audienceId },
    });

    return NextResponse.json(deleteEmailContact);
  } catch (error) {
    console.log("[EMAIL_AUDIENCE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ audienceId: string }> }) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { audienceId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const contact = await db.emailAudience.update({
      where: {
        id: audienceId,
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
