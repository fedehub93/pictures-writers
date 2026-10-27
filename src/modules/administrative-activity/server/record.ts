import "server-only";

import { Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

type ActivityClient = typeof db | Prisma.TransactionClient;
type ActivityValue = string | number | boolean | null;
export interface ActivityData {
  [key: string]: ActivityValue | ActivityData | ActivityValue[] | ActivityData[];
}

const safeKey = /^(accountStatus|action|bio|config|email|expiresAt|firstName|hasApiKey|hasWebhookSecret|imageUrl|invitationId|isActive|isEnabled|key|lastName|lastTestStatus|lastTestedAt|name|permissionIds|provider|role|roleId|secretKeys|status)$/;

export interface ActivitySanitizeOptions {
  /**
   * Keys whose object contents are non-secret by contract and must be kept
   * verbatim. Integration configuration uses this because it is public
   * provider configuration, not credentials.
   */
  preserveKeys?: readonly string[];
}

const sanitizeValue = (
  value: ActivityData | undefined,
  preserveKeys: ReadonlySet<string>,
): ActivityData | undefined => {
  if (!value) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, entry]) => safeKey.test(key) || (entry !== null && typeof entry === "object" && !Array.isArray(entry)))
      .map(([key, entry]) => [
        key,
        preserveKeys.has(key) && entry && typeof entry === "object" && !Array.isArray(entry)
          ? entry
          : Array.isArray(entry)
            ? entry.map((item) => (item && typeof item === "object" ? sanitizeValue(item as ActivityData, preserveKeys) ?? null : item))
            : entry && typeof entry === "object"
              ? sanitizeValue(entry as ActivityData, preserveKeys)
              : entry,
      ]),
  ) as ActivityData;
};

export const sanitizeActivityData = (
  value: ActivityData | undefined,
  options: ActivitySanitizeOptions = {},
): ActivityData | undefined =>
  sanitizeValue(value, new Set(options.preserveKeys ?? []));

export type ActivityInput = {
  actorId?: string;
  action: string;
  area: string;
  targetType: string;
  targetId?: string;
  outcome: "SUCCESS" | "FAILURE";
  before?: ActivityData;
  after?: ActivityData;
  preserveKeys?: readonly string[];
};

export const recordAdministrativeActivity = async (client: ActivityClient, input: ActivityInput) =>
  client.administrativeActivity.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      area: input.area,
      targetType: input.targetType,
      targetId: input.targetId,
      outcome: input.outcome,
      before: sanitizeActivityData(input.before, {
        preserveKeys: input.preserveKeys,
      }) as Prisma.InputJsonValue | undefined,
      after: sanitizeActivityData(input.after, {
        preserveKeys: input.preserveKeys,
      }) as Prisma.InputJsonValue | undefined,
    },
  });
