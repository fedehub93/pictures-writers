import { db } from "@/shared/lib/db";
import { EmailProviderAdapter } from "../../types";
import { resolveAdapter } from "../../provider";
import {
  providerErrorWarning,
  unexpectedErrorWarning,
} from "../propagate-utils";

/**
 * Propagate a newly-created audience to the email provider.
 * Calls adapter.syncSegment(null, name) to create the segment on the provider,
 * then saves the returned externalId on the audience record.
 *
 * Returns a warning string on failure (does NOT throw) so the caller
 * can include it in the tRPC response while the local create still succeeds.
 */
export async function propagateAudienceCreate(
  id: string,
  _adapter?: EmailProviderAdapter,
): Promise<{ propagationWarning?: string }> {
  try {
    const adapter = _adapter ?? (await resolveAdapter());

    const audience = await db.emailAudience.findUnique({
      where: { id },
      select: { id: true, name: true },
    });

    if (!audience) {
      return { propagationWarning: "Audience not found" };
    }

    const result = await adapter.syncSegment(null, audience.name);

    if (result.errors.length > 0) {
      return providerErrorWarning(result.errors);
    }

    if (result.newExternalId) {
      await db.emailAudience.update({
        where: { id },
        data: { externalId: result.newExternalId },
      });
    }

    return {};
  } catch (error) {
    return unexpectedErrorWarning("propagateAudienceCreate", error);
  }
}

/**
 * Propagate an updated audience (rename) to the email provider.
 * Calls adapter.syncSegment(externalId, newName) to update the segment name.
 * When the audience has no externalId yet, the segment is created instead.
 *
 * Returns a warning string on failure (does NOT throw).
 */
export async function propagateAudienceUpdate(
  id: string,
  _adapter?: EmailProviderAdapter,
): Promise<{ propagationWarning?: string }> {
  try {
    const adapter = _adapter ?? (await resolveAdapter());

    const audience = await db.emailAudience.findUnique({
      where: { id },
      select: { id: true, name: true, externalId: true },
    });

    if (!audience) {
      return { propagationWarning: "Audience not found" };
    }

    if (!audience.externalId) {
      // No externalId yet — create the segment on the provider instead
      const result = await adapter.syncSegment(null, audience.name);
      if (result.errors.length > 0) {
        return providerErrorWarning(result.errors);
      }
      if (result.newExternalId) {
        await db.emailAudience.update({
          where: { id },
          data: { externalId: result.newExternalId },
        });
      }
      return {};
    }

    const result = await adapter.syncSegment(audience.externalId, audience.name);

    if (result.errors.length > 0) {
      return providerErrorWarning(result.errors);
    }

    return {};
  } catch (error) {
    return unexpectedErrorWarning("propagateAudienceUpdate", error);
  }
}

/**
 * Propagate an audience deletion to the email provider.
 * Calls adapter.deleteSegment(externalId) to remove the remote segment.
 * When the audience has no externalId, the provider call is skipped.
 *
 * Returns a warning string on failure (does NOT throw) so the caller
 * can include it in the tRPC response while the local delete still succeeds.
 */
export async function propagateAudienceDelete(
  id: string,
  _adapter?: EmailProviderAdapter,
): Promise<{ propagationWarning?: string }> {
  try {
    const adapter = _adapter ?? (await resolveAdapter());

    const audience = await db.emailAudience.findUnique({
      where: { id },
      select: { id: true, externalId: true },
    });

    if (!audience) {
      return { propagationWarning: "Audience not found" };
    }

    // No externalId — nothing to remove on the provider
    if (!audience.externalId) {
      return {};
    }

    const result = await adapter.deleteSegment(audience.externalId);

    if (result.errors.length > 0) {
      return providerErrorWarning(result.errors);
    }

    return {};
  } catch (error) {
    return unexpectedErrorWarning("propagateAudienceDelete", error);
  }
}
