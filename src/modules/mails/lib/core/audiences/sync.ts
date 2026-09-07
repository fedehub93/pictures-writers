import { db } from "@/shared/lib/db";
import { EmailProviderAdapter, type BatchSyncResult } from "../../types";
import { resolveAdapter } from "../../provider";

/**
 * Shape returned when there is nothing to process (no contacts found).
 * Shared by the full re-sync and the delta import fast-paths.
 */
const emptyBatchResult = (): BatchSyncResult => ({
  success: true,
  totalProcessed: 0,
  successfulCount: 0,
  failedCount: 0,
  errors: [],
  syncedContacts: [],
});

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

  if (contacts.length === 0) {
    return emptyBatchResult();
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
 * Delta import: add only the contacts missing from an audience (matched by
 * interaction type) locally, then propagate exactly those to the provider
 * with a single `addContactsToSegment` call. Contacts that already exist on
 * the provider become segment members without being re-created; contacts that
 * don't exist yet are created with the segment attached and their returned
 * `externalId` is persisted locally.
 *
 * The delta is selected first (DB-only). When nothing is missing the import
 * returns a zero-result without resolving the provider or making any provider
 * call, so re-running an import is harmless even under provider
 * misconfiguration. Otherwise the audience segment is ensured on the provider
 * (persisting any returned `externalId`) before the missing contacts are
 * connected locally and propagated. Blocking: returns the final batch result
 * (counts + per-contact errors).
 */
export async function importContactsIntoAudience(
  audienceId: string,
  interactions: string[],
  skip: number,
  take: number,
  _adapter?: EmailProviderAdapter,
) {
  // 1. Load the audience (DB only)
  const audience = await db.emailAudience.findUnique({
    where: { id: audienceId },
  });

  if (!audience) {
    throw new Error("Audience not found");
  }

  // 2. Query contacts NOT in the audience with matching interaction types
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

  // 3. Empty delta → graceful zero-result: no provider resolution, no calls
  if (contacts.length === 0) {
    return emptyBatchResult();
  }

  // 4. Resolve the provider adapter only when there is something to import
  const adapter = _adapter ?? (await resolveAdapter());

  // 5. Ensure the audience segment exists on the provider, persisting any
  //    returned externalId
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

  const segmentExternalId = resultAudience.newExternalId ?? audience.externalId;
  if (!segmentExternalId) {
    throw new Error("Segment id could not be resolved for the audience");
  }

  // 6. Connect contacts to the audience locally
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

  // 7. Propagate only the delta to the provider
  const result = await adapter.addContactsToSegment(
    contacts.map((c) => ({
      email: c.email,
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      isSubscriber: c.isSubscriber,
      externalId: c.externalId,
    })),
    segmentExternalId,
  );

  // 8. Persist externalId for each contact created on the provider
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
