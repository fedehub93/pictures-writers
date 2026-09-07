import { db } from "@/shared/lib/db";
import { EmailProviderAdapter } from "../../types";
import { resolveAdapter } from "../../provider";

export async function syncContactWithProvider(
  id: string,
  _adapter?: EmailProviderAdapter,
) {
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

  const adapter = _adapter ?? (await resolveAdapter());

  // 3. Esecuzione granulare della sincronizzazione (upsert)
  const filteredAudiences = contact.audiences.filter((a) => !!a.externalId);

  const upsertResult = await adapter.upsertContact(
    contact.email,
    contact.id,
    contact.firstName,
    contact.lastName,
    contact.isSubscriber,
    filteredAudiences,
  );

  if (upsertResult.errors.length > 0) {
    throw new Error(`Contact not synced: ${upsertResult.errors.join(", ")}`);
  }

  if (!upsertResult.externalId) {
    throw new Error("Contact not upserted");
  }

  // Save the externalId if the contact didn't have one yet
  if (!contact.externalId) {
    await db.emailContact.update({
      where: { id: contact.id },
      data: { externalId: upsertResult.externalId },
    });
  }

  return { externalId: upsertResult.externalId };
}

export async function createContactOnProvider(
  id: string,
  _adapter?: EmailProviderAdapter,
) {
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
        where: {
          externalId: {
            not: null,
          },
        },
        select: {
          externalId: true,
        },
      },
    },
  });

  if (!contact) {
    throw new Error("Contact not found");
  }

  const adapter = _adapter ?? (await resolveAdapter());

  const filteredAudiences = contact.audiences.filter((a) => !!a.externalId);

  const { errors, newExternalId } = await adapter.createContact(
    contact.email,
    contact.id,
    contact.firstName,
    contact.lastName,
    contact.isSubscriber,
    filteredAudiences,
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

  // 2. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = await resolveAdapter();

  const { errors } = await adapter.deleteContact(contact.email);

  if (errors.length > 0) {
    throw new Error(`Contact not deleted: ${errors.join(", ")}`);
  }

  return errors;
}
