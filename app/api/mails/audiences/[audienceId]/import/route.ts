import { NextResponse } from "next/server";

import { authAdmin } from "@/lib/auth-service";
import { db } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { audienceId: string } }
) {
  try {
    const user = await authAdmin();
    const { audienceId } = params;
    const values = await req.json();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!values.interactions || values.interactions.length === 0) {
      return new NextResponse("Bad request", { status: 400 });
    }

    const contacts = await db.emailContact.findMany({
      where: {
        audiences: {
          none: { id: audienceId },
        },

        interactions: {
          some: {
            interactionType: { in: [...values.interactions] },
          },
        },
      },
    });

    for (const contact of contacts) {
      await db.emailContact.update({
        where: { id: contact.id },
        data: {
          audiences: {
            connect: {
              id: audienceId,
            },
          },
        },
      });
    }

    return NextResponse.json({ success: "Operazione eseguita" });
  } catch (error) {
    console.log("[EMAIL_AUDIENCE_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
