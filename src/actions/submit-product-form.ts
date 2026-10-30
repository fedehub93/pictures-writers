"use server";

import { ProductAcquisitionMode } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

import { createContactByEmail } from "@/data/email-contact";
import { handleFormSubmitted } from "@/lib/event-handler";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";

import { verifyRecaptcha } from "@/lib/recaptcha";
import { getPublishedProductByRootId } from "@/modules/shop/products";
import { normalizeEmail } from "@/shared/lib/email";

export const submitProductForm = async (
  rootId: string,
  values: Record<string, any>,
  recaptchaToken: string,
) => {
  try {
    // 1. Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "submit_product_form",
    );

    if (!recaptchaResult.success) {
      return {
        success: false,
        message:
          recaptchaResult.error ||
          "Security verification failed. Please try again.",
      };
    }

    // 2. Validate the form data
    const product = await getPublishedProductByRootId(rootId);

    if (
      !product ||
      product.acquisitionMode !== ProductAcquisitionMode.FORM ||
      !product.formId
    ) {
      return { success: false, message: "Product not found" };
    }

    // Recupera il form per validare che esista
    const form = await db.form.findUnique({
      where: { id: product.formId },
      select: { id: true, fields: true },
    });

    if (!form) {
      return { success: false, message: "Form not found" };
    }

    if (typeof values !== "object" || Array.isArray(values)) {
      return { success: false, message: "Invalid submission data format" };
    }

    const responderEmail =
      typeof values.email === "string" ? normalizeEmail(values.email) : null;

    // Salva la submission
    await db.formSubmission.create({
      data: {
        formId: product.formId,
        email: responderEmail,
        data: values,
      },
    });

    // An address-less submission is still recorded, but it cannot own a Contact
    // or start an automation: those are keyed by the address.
    if (responderEmail) {
      const contact = await createContactByEmail(
        responderEmail,
        "submit_product_form",
      );

      // Start any automation listening for this internal event. The forms
      // module uses the canonical address as the idempotency key so a repeated
      // submission from the same person cannot start a second nurture cycle
      // (ADR-0005).
      try {
        await emitFormSubmitted({
          formId: product.formId,
          email: contact?.email ?? responderEmail,
          contactId: contact?.id ?? null,
          data: values,
        });
      } catch (automationError) {
        console.error(
          "Error enqueuing form.submitted automation: ",
          automationError,
        );
      }
    }

    //  Send notification to admins
    await handleFormSubmitted();

    return {
      success: true,
      message: "Form inviato con successo!",
    };
  } catch (error) {
    console.error("Error submitting dynamic form: ", error);
    return {
      success: false,
      message: "Qualcosa è andato storto! Riprovare.",
    };
  }
};
