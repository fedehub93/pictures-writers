import { db } from "@/shared/lib/db";
import { EmailProviderAdapter } from "../../types";
import { resolveAdapter } from "../../provider";
import {
  providerErrorWarning,
  unexpectedErrorWarning,
} from "../propagate-utils";

/**
 * Propagate a newly-created contact to the email provider.
 * 1. Sync any associated audiences that lack an externalId.
 * 2. Call adapter.upsertContact with the contact data.
 * 3. Persist the returned externalId.
 *
 * Returns a warning string on failure (does NOT throw) so the caller
 * can include it in the tRPC response while the local create still succeeds.
 */
export async function propagateContactCreate(
  id: string,
  _adapter?: EmailProviderAdapter,
): Promise<{ propagationWarning?: string }> {
  try {
    const adapter = _adapter ?? (await resolveAdapter());

    // 1. Load the contact with its audiences
    const contact = await db.emailContact.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSubscriber: true,
        audiences: {
          select: {
            id: true,
            name: true,
            externalId: true,
          },
        },
      },
    });

    if (!contact) {
      return { propagationWarning: "Contact not found" };
    }

    // 2. Sync audiences that lack an externalId
    for (const audience of contact.audiences) {
      if (!audience.externalId) {
        const segResult = await adapter.syncSegment(null, audience.name);
        if (segResult.errors.length > 0) {
          console.error(
            `[propagateContactCreate] Failed to sync audience ${audience.id}: ${segResult.errors.join(", ")}`,
          );
          // Continue — don't block the contact creation
        }
        if (segResult.newExternalId) {
          await db.emailAudience.update({
            where: { id: audience.id },
            data: { externalId: segResult.newExternalId },
          });
          // Update in-memory so the upsert gets the fresh externalId
          audience.externalId = segResult.newExternalId;
        }
      }
    }

    // 3. Upsert the contact on the provider
    const audiencesWithExt = contact.audiences.filter((a) => !!a.externalId);
    const upsertResult = await adapter.upsertContact(
      contact.email,
      contact.id,
      contact.firstName,
      contact.lastName,
      contact.isSubscriber,
      audiencesWithExt,
    );

    if (upsertResult.errors.length > 0) {
      return providerErrorWarning(upsertResult.errors);
    }

    // 4. Persist externalId
    if (upsertResult.externalId) {
      await db.emailContact.update({
        where: { id },
        data: { externalId: upsertResult.externalId },
      });
    }

    return {};
  } catch (error) {
    return unexpectedErrorWarning("propagateContactCreate", error);
  }
}

/**
 * Propagate an updated contact to the email provider.
 * Calls adapter.upsertContact with the current contact data and audience associations.
 *
 * Returns a warning string on failure (does NOT throw).
 */
export async function propagateContactUpdate(
  id: string,
  _adapter?: EmailProviderAdapter,
): Promise<{ propagationWarning?: string }> {
  try {
    const adapter = _adapter ?? (await resolveAdapter());

    const contact = await db.emailContact.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        isSubscriber: true,
        audiences: {
          select: {
            externalId: true,
          },
        },
      },
    });

    if (!contact) {
      return { propagationWarning: "Contact not found" };
    }

    const audiencesWithExt = contact.audiences.filter((a) => !!a.externalId);
    const upsertResult = await adapter.upsertContact(
      contact.email,
      contact.id,
      contact.firstName,
      contact.lastName,
      contact.isSubscriber,
      audiencesWithExt,
    );

    if (upsertResult.errors.length > 0) {
      return providerErrorWarning(upsertResult.errors);
    }

    return {};
  } catch (error) {
    return unexpectedErrorWarning("propagateContactUpdate", error);
  }
}
