"use server";

import * as v from "valibot";

import { ProductAcquisitionMode, ProductType } from "@/generated/prisma";
import { db } from "@/shared/lib/db";
import { FreeDigitalDownloadSchemaValibot } from "@/schemas";
import {
  buildFreeDigitalDownloadEmail,
  sendEmail,
} from "@/modules/mails/lib/mail";
import { createContactByEmail } from "@/data/email-contact";
import { handleDigitalDownloaded } from "@/lib/event-handler";
import { verifyRecaptcha } from "@/lib/recaptcha";
import { createContactOnProvider } from "@/modules/mails/lib/core";
import { emitFormSubmitted } from "@/modules/forms/automations/emit";
import { getPublishedProductByRootId } from "@/modules/shop/products";

export const subscribeFreeDigitalProduct = async (
  values: v.InferInput<typeof FreeDigitalDownloadSchemaValibot>,
  recaptchaToken: string,
) => {
  try {
    // 1. Verify reCAPTCHA first
    const recaptchaResult = await verifyRecaptcha(
      recaptchaToken,
      "subscribe_product",
    );
    if (!recaptchaResult.success) {
      return {
        success: false,
        message:
          recaptchaResult.error ||
          "Security verification failed. Please try again.",
      };
    }

    // 2. Validate the submission (email + privacy consent)
    const validatedFields = v.safeParse(
      FreeDigitalDownloadSchemaValibot,
      values,
    );

    if (!validatedFields.success) {
      return {
        success: false,
        message:
          validatedFields.issues[0]?.message ?? "I dati inseriti non sono validi.",
      };
    }

    const { email, rootId } = validatedFields.output;

    // 3. Load the live product and the form that drives the download
    const product = await getPublishedProductByRootId(rootId);

    if (
      !product ||
      product.type !== ProductType.EBOOK ||
      product.acquisitionMode !== ProductAcquisitionMode.FORM
    ) {
      return { success: false, message: "Prodotto non trovato." };
    }

    if (!product.formId) {
      return { success: false, message: "Modulo non trovato." };
    }

    const form = await db.form.findUnique({
      where: { id: product.formId },
      select: { id: true, interactionType: true },
    });

    if (!form) {
      return { success: false, message: "Modulo non trovato." };
    }

    // Resolve the delivery email before recording anything, so a missing global
    // template does not create a submission the visitor cannot fulfil.
    const deliveryEmail = await buildFreeDigitalDownloadEmail(email, rootId);

    if (!deliveryEmail) {
      return {
        success: false,
        message:
          "Il download non è al momento disponibile. Riprova più tardi.",
      };
    }

    // 4. Deliver the file before recording anything, so a provider failure does
    // not leave a submission and a nurture sequence for an email that never
    // arrived.
    const isEmailSent = await sendEmail(deliveryEmail);

    if (!isEmailSent) {
      return {
        success: false,
        message: "C'è stato un errore durante l'invio della mail. Riprova.",
      };
    }

    // 5. Create/update the contact with the interaction declared by the form.
    // The upsert on `[contactId, interactionType]` makes repeated downloads
    // from the same contact safe.
    const contact = await createContactByEmail(
      email,
      form.interactionType ?? undefined,
    );

    // 6. Record the download as a submission of the linked form
    await db.formSubmission.create({
      data: {
        formId: form.id,
        email,
        data: { email, rootId, privacyConsent: true },
      },
    });

    // 7. Start any automation listening for this form's submissions
    try {
      await emitFormSubmitted({
        formId: form.id,
        email,
        contactId: contact.id,
        data: { email, rootId },
      });
    } catch (automationError) {
      console.error(
        "Error enqueuing form.submitted automation: ",
        automationError,
      );
    }

    // 8. Notify admins. A notification failure must not fail the download the
    // visitor already received.
    try {
      await handleDigitalDownloaded();
    } catch (notificationError) {
      console.error("Download notification failed:", notificationError);
    }

    try {
      await createContactOnProvider(contact.id);
    } catch (error) {
      console.error("Provider contact sync failed after download:", error);
    }

    return {
      success: true,
      message:
        "È stata inviata una email al tuo indirizzo dove puoi scaricare il prodotto gratuito!",
    };
  } catch (error) {
    console.error("Error submitting free digital download: ", error);
    return {
      success: false,
      message: "Qualcosa è andato storto! Riprovare.",
    };
  }
};
