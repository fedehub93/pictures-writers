import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

import { formFormSchema } from "@/schemas/form";

export async function GET(req: Request) {
  try {
    const user = await authAdmin();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const forms = await db.form.findMany();

    if (!forms) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(forms);
  } catch (error) {
    console.log("[FORM_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await authAdmin();

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

    const form = await db.form.create({
      data: { ...values },
    });

    if (!form) {
      return new NextResponse("Bad Request", { status: 400 });
    }

    return NextResponse.json(form);
  } catch (error) {
    console.log("[FORM_CREATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
