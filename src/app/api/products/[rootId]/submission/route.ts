import { NextResponse } from "next/server";
import { ProductAcquisitionMode } from "@/generated/prisma";

import { db } from "@/lib/db";
import { getPublishedProductByRootId } from "@/modules/shop/products";
import { createContactByEmail } from "@/data/email-contact";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";

export async function POST(
  req: Request,
  props: {
    params: Promise<{
      rootId: string;
    }>;
  }
) {
  try {
    const { rootId } = await props.params;

    if (!rootId) {
      return NextResponse.json(
        { error: "Missing rootId in URL" },
        { status: 400 }
      );
    }

    // Dati inviati dal client
    const body = await req.json();

    const product = await getPublishedProductByRootId(rootId);

    if (
      !product ||
      product.acquisitionMode !== ProductAcquisitionMode.FORM ||
      !product.formId
    ) {
      return NextResponse.json({ error: "Product not found" }, { status: 400 });
    }

    // Recupera il form per validare che esista
    const form = await db.form.findUnique({
      where: { id: product.formId },
      select: { id: true, fields: true },
    });

    if (!form) {
      return NextResponse.json({ error: "Form not found" }, { status: 400 });
    }

    if (typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        { error: "Invalid submission data format" },
        { status: 400 }
      );
    }

    const emailFromBody = body.email || null;

    // Salva la submission
    const submission = await db.formSubmission.create({
      data: {
        formId: product.formId,
        email: emailFromBody,
        data: body,
      },
    });

    // Emission needs an email: the contact is its idempotency key source and
    // the payload's responder. An address-less submission keeps the old
    // behaviour (200 with the stored submission, no contact, no emit).
    if (emailFromBody) {
      const contact = await createContactByEmail(
        emailFromBody,
        "submit_product_form",
      );

      // Start any automation listening for this internal event. The forms
      // module chooses the idempotency key (the contact id) so a repeated
      // submission from the same contact cannot start a second nurture cycle
      // (ADR-0005).
      try {
        await emitFormSubmitted({
          formId: product.formId,
          email: emailFromBody,
          contactId: contact?.id ?? null,
          data: body,
        });
      } catch (automationError) {
        console.error(
          "Error enqueuing form.submitted automation: ",
          automationError,
        );
      }
    }

    return NextResponse.json({
      submissionId: submission.id,
    });
  } catch (error) {
    console.error("PRODUCTS_ROOT_ID_SUBMISSION:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
