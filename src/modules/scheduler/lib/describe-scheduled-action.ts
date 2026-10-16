import "server-only";

import { db } from "@/shared/lib/db";
import { ScheduledActionType } from "@/generated/prisma";

import { SCHEDULER_TARGET_TYPES } from "../constants";

/**
 * The admin URL a scheduled action's target should link to. Returns `""` for a
 * target type this build does not know about, so a caller renders the row
 * without a link rather than pointing somewhere wrong.
 */
export function buildScheduledActionUrl(
  targetType: string,
  targetId: string,
): string {
  switch (targetType) {
    case SCHEDULER_TARGET_TYPES.POST_ROOT:
      return `/admin/posts/${targetId}`;
    case SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND:
      return `/admin/mails/single-sends/${targetId}`;
    default:
      return "";
  }
}

interface DescribableAction {
  id: string;
  type: ScheduledActionType;
  targetType: string;
  targetId: string;
}

export interface ScheduledActionDescription {
  title: string;
  url: string;
}

/**
 * Resolve the display title and admin URL of each scheduled action's target:
 * post titles come from the current version, newsletter titles from the send's
 * name, and an unknown or deleted target gets a generic label. Lives here, not
 * in the calendar query, so every surface that lists scheduled actions — the
 * calendar and the dashboard widget — labels and links them identically.
 */
export async function describeScheduledActions(
  actions: DescribableAction[],
): Promise<Map<string, ScheduledActionDescription>> {
  const postRootIds = [
    ...new Set(
      actions
        .filter((action) => action.type === ScheduledActionType.PUBLISH_POST)
        .map((action) => action.targetId),
    ),
  ];
  const singleSendIds = [
    ...new Set(
      actions
        .filter((action) => action.type === ScheduledActionType.SEND_EMAIL)
        .map((action) => action.targetId),
    ),
  ];

  const [postRoots, singleSends] = await Promise.all([
    postRootIds.length > 0
      ? db.postRoot.findMany({
          where: { id: { in: postRootIds } },
          select: { id: true, currentVersion: { select: { title: true } } },
        })
      : Promise.resolve([]),
    singleSendIds.length > 0
      ? db.emailSingleSend.findMany({
          where: { id: { in: singleSendIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const postTitleById = new Map(
    postRoots.map((root) => [
      root.id,
      root.currentVersion?.title ?? "Unknown post",
    ]),
  );

  const sendNameById = new Map(singleSends.map((send) => [send.id, send.name]));

  const descriptions = new Map<string, ScheduledActionDescription>();

  for (const action of actions) {
    let title = "Unknown";

    if (action.type === ScheduledActionType.PUBLISH_POST) {
      title = postTitleById.get(action.targetId) ?? "Unknown post";
    } else if (action.type === ScheduledActionType.SEND_EMAIL) {
      title = sendNameById.get(action.targetId) ?? "Unknown newsletter";
    }

    descriptions.set(action.id, {
      title,
      url: buildScheduledActionUrl(action.targetType, action.targetId),
    });
  }

  return descriptions;
}
