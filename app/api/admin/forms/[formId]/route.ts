import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

import { formFormSchema } from "@/schemas/form";

export async function DELETE(
  req: Request,
  props: {
    params: Promise<{
      formId: string;
    }>;
  }
) {
  try {
    const params = await props.params;
    const user = await authAdmin();
    const { formId } = params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const form = await db.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deletedForm = await db.form.deleteMany({
      where: { id: formId },
    });

    return NextResponse.json(deletedForm);
  } catch (error) {
    console.log("[FORM_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  props: {
    params: Promise<{
      formId: string;
    }>;
  }
) {
  try {
    const user = await authAdmin();
    const { formId } = await props.params;

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Data parsing and validation
    const body = await req.json();
    const parsed = formFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(parsed.error, { status: 400 });
    }

    const values = parsed.data;

    const form = await db.form.findUnique({
      where: { id: formId },
    });

    if (!form) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const updatedForm = await db.form.update({
      where: { id: form.id },
      data: { ...values },
    });

    return NextResponse.json(updatedForm);
  } catch (error) {
    console.log("[FORM_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
