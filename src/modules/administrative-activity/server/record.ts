import "server-only";

import { Prisma } from "@/generated/prisma";

import { db } from "@/shared/lib/db";

type ActivityClient = typeof db | Prisma.TransactionClient;
type ActivityValue = string | number | boolean | null;
interface ActivityData {
  [key: string]: ActivityValue | ActivityData | ActivityValue[] | ActivityData[];
}

const safeKey = /^(accountStatus|action|bio|email|expiresAt|firstName|imageUrl|invitationId|isActive|key|lastName|name|permissionIds|role|roleId|status)$/;

export const sanitizeActivityData = (value: ActivityData | undefined): ActivityData | undefined => {
  if (!value) return undefined;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key, entry]) => safeKey.test(key) || (entry !== null && typeof entry === "object" && !Array.isArray(entry)))
      .map(([key, entry]) => [
        key,
        Array.isArray(entry)
          ? entry.map((item) => (item && typeof item === "object" ? sanitizeActivityData(item as ActivityData) ?? null : item))
          : entry && typeof entry === "object"
            ? sanitizeActivityData(entry as ActivityData)
            : entry,
      ]),
  ) as ActivityData;
};

export type ActivityInput = {
  actorId?: string;
  action: string;
  area: string;
  targetType: string;
  targetId?: string;
  outcome: "SUCCESS" | "FAILURE";
  before?: ActivityData;
  after?: ActivityData;
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
      before: sanitizeActivityData(input.before) as Prisma.InputJsonValue | undefined,
      after: sanitizeActivityData(input.after) as Prisma.InputJsonValue | undefined,
    },
  });
