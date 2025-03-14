import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";

export async function POST(req: Request) {
  try {
    const user = await authAdmin();
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const audiences: { id: string }[] = values.audiences
      ? [...values.audiences]
      : [];

    const contact = await db.emailContact.create({
      data: {
        ...values,
        audiences: audiences
          ? {
              connect: audiences.map((audience: { id: string }) => ({
                id: audience.id,
              })),
            }
          : undefined,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.log("[EMAIL_CONTACTS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
