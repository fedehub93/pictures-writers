import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function DELETE(req: Request, props: { params: Promise<{ singleSendId: string }> }) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { singleSendId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const singleSend = await db.emailSingleSend.findUnique({
      where: {
        id: params.singleSendId,
      },
    });

    if (!singleSend) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletesingleSend = await db.emailSingleSend.delete({
      where: { id: singleSendId },
    });

    return NextResponse.json(deletesingleSend);
  } catch (error) {
    console.log("[EMAIL_SINGLE_SEND_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, props: { params: Promise<{ singleSendId: string }> }) {
  const params = await props.params;
  try {
    const user = await authAdmin();
    const { singleSendId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const audiences: { label: string; value: string }[] = values.audiences
      ? [...values.audiences]
      : [];

    const singleSend = await db.emailSingleSend.update({
      where: {
        id: singleSendId,
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

    return NextResponse.json(singleSend);
  } catch (error) {
    console.log("[EMAIL_SINGLE_SEND_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
