"use server";

import { ProductAcquisitionMode } from "@/prisma/generated/client";

import { createContactByEmail } from "@/data/email-contact";
import { handleFormSubmitted } from "@/lib/event-handler";

import { verifyRecaptcha } from "@/lib/recaptcha";
import { getPublishedProductByRootId } from "@/data/product";
import { db } from "@/lib/db";

export const submitProductForm = async (
  rootId: string,
  values: any,
  recaptchaToken: string
) => {
  try {
    // 1. Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "submit_product_form"
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

    const emailFromBody = values.email || null;

    // Salva la submission
    const submission = await db.formSubmission.create({
      data: {
        formId: product.formId,
        email: emailFromBody,
        data: values,
      },
    });

    await createContactByEmail(emailFromBody, "submit_product_form");

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
