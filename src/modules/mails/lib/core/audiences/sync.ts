import { db } from "@/shared/lib/db";
import { EmailProviderAdapter } from "../../types";
import { resolveAdapter } from "../../provider";

/**
 * Sync an audience and all of its contacts to the email provider.
 * - If an audienceId is given, the audience segment is synced first
 *   (persisting any returned externalId).
 * - Then all contacts of that audience are batch-synced and their
 *   returned externalIds are persisted.
 *
 * Blocking style: throws if the segment cannot be synced or the
 * audience does not exist. Used by the manual sync / import flows.
 */
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
  const adapter = _adapter ?? (await resolveAdapter());

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

/**
 * Add contacts (matched by interaction type) to an audience locally and
 * propagate the change to the provider.
 */
export async function updateContactsAudience(
  audienceId: string,
  interactions: string[],
  skip: number,
  take: number,
) {
  // 1. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = await resolveAdapter();

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
