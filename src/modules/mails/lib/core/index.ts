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

export { getProviderAdapter };

async function resolveAdapter(): Promise<EmailProviderAdapter> {
  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }
  return getProviderAdapter(emailSettings.emailProvider);
}

export async function syncContactsWithProvider(
  {
    skip,
    take,
    audienceId,
  }: {
    skip: number;
    take: number;
    audienceId?: string;
  },
  _adapter?: EmailProviderAdapter,
) {
  const adapter = _adapter ?? await resolveAdapter();

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
    return {
      success: true,
      totalProcessed: 0,
      successfulCount: 0,
      failedCount: 0,
      errors: [],
      syncedContacts: [],
    };
  }

  // 4. Aggiorniamo l'elenco contatti associato
  const result = await adapter.syncContactsBatch(contacts);

  // 5. Persist externalId for each successfully synced contact
  if (result.syncedContacts.length > 0) {
    await db.$transaction(
      result.syncedContacts.map((sc) =>
        db.emailContact.update({
          where: { id: sc.localId },
          data: { externalId: sc.externalId },
        }),
      ),
    );
  }

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

export async function syncContactWithProvider(id: string, _adapter?: EmailProviderAdapter) {
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

  const adapter = _adapter ?? await resolveAdapter();

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

export async function createContactOnProvider(id: string, _adapter?: EmailProviderAdapter) {
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

  const adapter = _adapter ?? await resolveAdapter();

  const filteredAudiences = contact.audiences.filter(
    (a) => !!a.externalId,
  );

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
  idempotencyKey,
}: {
  segmentExternalId: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
  idempotencyKey?: string;
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
    idempotencyKey,
  });

  return providerResult;
}
