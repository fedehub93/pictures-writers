import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authAdmin } from "@/lib/auth-service";
import { deleteContactOnProvider } from "@/lib/mail/core";

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

    const emailContact = await db.emailContact.findUnique({
      where: {
        id: params.id,
      },
    });

    if (!emailContact) {
      return new NextResponse("Not found", { status: 404 });
    }

    const deleteEmailContact = await db.emailContact.delete({
      where: { id },
    });

    await deleteContactOnProvider(deleteEmailContact.email);

    return NextResponse.json(deleteEmailContact);
  } catch (error) {
    console.log("[EMAIL_CONTACT_ID_DELETE]", error);
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

    const audiences: { id: string }[] = values.audiences
      ? [...values.audiences]
      : [];

    const interactions: { id: string }[] = values.interactions
      ? [...values.interactions]
      : [];

    const contact = await db.emailContact.update({
      where: {
        id: id,
      },
      data: {
        ...values,
        audiences: values.audiences
          ? {
              set: audiences.map((audience) => ({
                id: audience.id,
              })),
            }
          : undefined,
        interactions: undefined,
      },
    });

    await db.emailContactInteraction.deleteMany({
      where: { contactId: contact.id },
    });

    for (const interaction of interactions) {
      await db.emailContactInteraction.create({
        data: {
          contactId: contact.id,
          interactionType: interaction.id,
          interactionDate: new Date(),
        },
      });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.log("[EMAIL_CONTACT_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
