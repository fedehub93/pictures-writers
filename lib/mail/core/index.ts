import { db } from "@/lib/db";
import { ResendAdapter } from "../adapters/resend-adapter";
import { EmailProviderAdapter } from "../types";

// Factory Helper per isolare lo switch dei provider
function getProviderAdapter(providerType: string): EmailProviderAdapter {
  switch (providerType) {
    case "RESEND":
      return new ResendAdapter();
    case "SENDGRID":
      throw new Error("SendGrid is not integrated yet");
    default:
      throw new Error("Provider not supported");
  }
}

export async function syncAudienceWithProvider(
  audienceId: string,
  skip: number,
  take: number,
) {
  // 1. Recupero Dati dal Database
  const audience = await db.emailAudience.findUnique({
    where: { id: audienceId },
    select: {
      id: true,
      name: true,
      externalId: true,
      contacts: {
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isSubscriber: true,
        },
      },
    },
  });

  if (!audience) {
    throw new Error("Audience not found or not linked");
  }

  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }

  let externalId = audience.externalId;

  // 2. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = getProviderAdapter(emailSettings.emailProvider);
  // 3. Esecuzione granulare della sincronizzazione
  // A. Aggiorniamo i dettagli dell'Audience (es. cambio nome)
  if (!externalId) {
    const segmentResult = await adapter.syncSegment(
      audience.externalId,
      audience.name,
    );

    if (!segmentResult.newExternalId) {
      throw new Error("Segment not created");
    }

    externalId = segmentResult.newExternalId;

    await db.emailAudience.update({
      where: { id: audience.id },
      data: { externalId },
    });
  }

  // B. Aggiorniamo l'elenco contatti associato
  const result = await adapter.syncContactsBatch(externalId, audience.contacts);

  return result;
}

export async function syncContactWithProvider(id: string) {
  // 1. Recupero Dati dal Database
  const contact = await db.emailContact.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSubscriber: true,
      externalId: true,
      audiences: {
        select: {
          externalId: true,
        },
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }

  let externalId = contact.externalId;

  // 2. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = getProviderAdapter(emailSettings.emailProvider);
  // 3. Esecuzione granulare della sincronizzazione
  // A. Aggiorniamo i dettagli dell'Audience (es. cambio nome)
  if (!externalId) {
    const filteredAudiences = contact.audiences
      .filter((a) => !!a.externalId)
      .map((a) => ({ id: a.externalId })) as { id: string }[];

    const contactResult = await adapter.createContact(
      contact.email,
      contact.firstName,
      contact.lastName,
      contact.isSubscriber,
      filteredAudiences,
    );

    if (!contactResult.newExternalId) {
      throw new Error("Segment not created");
    }

    externalId = contactResult.newExternalId;

    await db.emailContact.update({
      where: { id: contact.id },
      data: { externalId },
    });
  }

  return { externalId };
}

export async function createContactOnProvider(id: string) {
  // 1. Recupero Dati dal Database
  const contact = await db.emailContact.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSubscriber: true,
      externalId: true,
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }

  // 2. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = getProviderAdapter(emailSettings.emailProvider);

  const { errors, newExternalId } = await adapter.createContact(
    contact.email,
    contact.firstName,
    contact.lastName,
    contact.isSubscriber,
  );

  if (!newExternalId) {
    throw new Error("Contact not created");
  }

  if (errors.length > 0) {
    throw new Error(`Contact not created: ${errors.join(", ")}`);
  }

  await db.emailContact.update({
    where: { id },
    data: { externalId: newExternalId },
  });

  return newExternalId;
}

export async function deleteContactOnProvider(id: string) {
  // 1. Recupero Dati dal Database
  const contact = await db.emailContact.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      isSubscriber: true,
      externalId: true,
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }

  // 2. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = getProviderAdapter(emailSettings.emailProvider);

  const { errors } = await adapter.deleteContact(contact.email);

  if (errors.length > 0) {
    throw new Error(`Contact not deleted: ${errors.join(", ")}`);
  }

  return errors;
}
