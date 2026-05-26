import { db } from "@/shared/lib/db";
import { EmailProviderAdapter } from "../types";
import { ResendAdapter } from "../adapters/resend-adapter";

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
export async function syncContactsWithProvider({
  skip,
  take,
  audienceId,
}: {
  skip: number;
  take: number;
  audienceId?: string;
}) {
  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }

  // 1. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = getProviderAdapter(emailSettings.emailProvider);

  // 2. Se esiste un audience id, prima sincronizzo quello
  if (audienceId) {
    const audience = await db.emailAudience.findUnique({
      where: { id: audienceId },
    });

    if (!audience) {
      throw new Error("Audience not found");
    }

    const resultAudience = await adapter.syncSegment(
      audience.externalId,
      audience.name,
    );
    if (resultAudience.errors.length > 0) {
      throw new Error(
        `Segment not synced: ${resultAudience.errors.join(", ")}`,
      );
    }

    if (resultAudience.newExternalId) {
      await db.emailAudience.update({
        where: { id: audienceId },
        data: { externalId: resultAudience.newExternalId },
      });
    }
  }

  // 3. Recupero Dati dal Database
  const contacts = await db.emailContact.findMany({
    where: {
      audiences: {
        some: { id: audienceId },
      },
    },
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
          id: true,
          name: true,
          externalId: true,
        },
      },
    },
    skip,
    take,
  });

  if (!contacts || contacts.length === 0) {
    throw new Error("Contacts not found");
  }

  // 4. Aggiorniamo l'elenco contatti associato
  const result = await adapter.syncContactsBatch(contacts);

  return result;
}

export async function updateContactsAudience(
  audienceId: string,
  interactions: string[],
  skip: number,
  take: number,
) {
  // 1. Recupero dati dal database

  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }

  // 1. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = getProviderAdapter(emailSettings.emailProvider);

  // 2. Se esiste un audience id, prima sincronizzo quello
  const audience = await db.emailAudience.findUnique({
    where: { id: audienceId },
  });

  if (!audience) {
    throw new Error("Audience not found");
  }

  const resultAudience = await adapter.syncSegment(
    audience.externalId,
    audience.name,
  );
  if (resultAudience.errors.length > 0) {
    throw new Error(`Segment not synced: ${resultAudience.errors.join(", ")}`);
  }

  if (resultAudience.newExternalId) {
    await db.emailAudience.update({
      where: { id: audienceId },
      data: { externalId: resultAudience.newExternalId },
    });
  }

  const contacts = await db.emailContact.findMany({
    where: {
      audiences: {
        none: { id: audience.id },
      },
      interactions: {
        some: {
          interactionType: { in: interactions },
        },
      },
    },
    skip,
    take,
  });

  // 2. Aggiorno dati nel database
  for (const contact of contacts) {
    await db.emailContact.update({
      where: { id: contact.id },
      data: {
        audiences: {
          connect: {
            id: audience.id,
          },
        },
      },
    });
  }

  // 3. Sincronizzo con il provider

  const result = await syncContactsWithProvider({ skip, take, audienceId });

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
    const filteredAudiences = contact.audiences.filter((a) => !!a.externalId);

    const contactResult = await adapter.createContact(
      contact.email,
      contact.id,
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
    contact.id,
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

export async function sendBulk({
  segmentExternalId,
  subject,
  html,
  from,
  replyTo,
}: {
  segmentExternalId: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
}) {
  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }
  // 4. Inizializzazione del tuo Adapter (es. ResendAdapter, MailchimpAdapter, ecc.)
  const adapter = getProviderAdapter(emailSettings.emailProvider);
  // mailProviderAdapter cambierà l'istanza in base alla tua configurazione injector/factory
  const providerResult = await adapter.sendBulk({
    segmentExternalId,
    subject,
    html,
    from,
    replyTo,
  });

  return providerResult;
}
