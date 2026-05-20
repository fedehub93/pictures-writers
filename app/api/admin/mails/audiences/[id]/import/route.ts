import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { updateContactsAudience } from "@/lib/mail/core";

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

    if (!values.interactions || values.interactions.length === 0) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const skip = Number(values.skip);
    const take = Number(values.take);

    // 1. Recupera i contatti dal tuo DB
    const result = await updateContactsAudience(
      id,
      values.interactions,
      Number(skip),
      Number(take),
    );

    return NextResponse.json({
      message: "Import successfully",
      ...result,
    });
  } catch (error) {
    console.log("[EMAIL_AUDIENCE_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
