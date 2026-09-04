import "server-only";

import { addHours } from "date-fns";

import { db } from "@/shared/lib/db";
import {
  ContentStatus,
  ScheduledActionStatus,
  ScheduledActionType,
  type Prisma,
} from "@/generated/prisma";

import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarEventType,
  GetCalendarEventsInput,
} from "../types";

const TERMINAL_STATUSES: ScheduledActionStatus[] = [
  ScheduledActionStatus.SUCCEEDED,
  ScheduledActionStatus.FAILED,
  ScheduledActionStatus.CANCELED,
];

function isTerminalStatus(status: ScheduledActionStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

function buildActionUrl(targetType: string, targetId: string): string {
  if (targetType === "POST_ROOT") {
    return `/admin/posts/${targetId}`;
  }

  if (targetType === "EMAIL_SINGLE_SEND") {
    return `/admin/mails/single-sends/${targetId}`;
  }

  return "";
}

function buildManualPostUrl(rootId: string): string {
  return `/admin/posts/${rootId}`;
}

function resolveActionStart(action: {
  plannedAt: Date;
  executedAt: Date | null;
  status: ScheduledActionStatus;
}): Date {
  // Historical events use the actual execution time when available.
  // Future and canceled-but-never-executed events fall back to planned time.
  if (action.executedAt) {
    return action.executedAt;
  }

  return action.plannedAt;
}

function isOverdue(action: {
  plannedAt: Date;
  status: ScheduledActionStatus;
}): boolean {
  if (isTerminalStatus(action.status)) {
    return false;
  }

  return action.plannedAt.getTime() < Date.now();
}

function actionTypeFilter(
  actionTypes: CalendarEventType[] | undefined,
): Prisma.ScheduledActionWhereInput | undefined {
  if (!actionTypes || actionTypes.length === 0) {
    return undefined;
  }

  return { type: { in: actionTypes } };
}

function actionStatusFilter(
  statuses: CalendarEventStatus[] | undefined,
): Prisma.ScheduledActionWhereInput | undefined {
  if (!statuses || statuses.length === 0) {
    return undefined;
  }

  const actionStatuses = statuses
    .map((status) =>
      status === "PUBLISHED" ? ScheduledActionStatus.SUCCEEDED : status,
    )
    .filter(
      (status): status is ScheduledActionStatus =>
        Object.values(ScheduledActionStatus).includes(status),
    );

  if (actionStatuses.length === 0) {
    return undefined;
  }

  return { status: { in: actionStatuses } };
}

/**
 * Query calendar events for a visible date range.
 *
 * The interval is treated as half-open: [from, to). Events on both
 * boundaries are included correctly: a future event planned exactly at
 * `from` is included, and a historical event executed exactly at `to` is
 * excluded.
 *
 * Returns a normalized event list independent of the underlying Post or
 * EmailSingleSend models. The history includes manually published Posts
 * only when no corresponding SUCCEEDED scheduled action represents the
 * same publication instant, so scheduler-published posts are never shown
 * twice.
 */
export async function getCalendarEvents({
  from,
  to,
  actionTypes,
  statuses,
}: GetCalendarEventsInput): Promise<CalendarEvent[]> {
  const filters: Prisma.ScheduledActionWhereInput[] = [
    actionTypeFilter(actionTypes),
    actionStatusFilter(statuses),
  ].filter((filter): filter is Prisma.ScheduledActionWhereInput => !!filter);

  const actions = await db.scheduledAction.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              executedAt: { not: null, gte: from, lt: to },
            },
            {
              executedAt: null,
              plannedAt: { gte: from, lt: to },
            },
          ],
        },
        ...filters,
      ],
    },
    orderBy: [{ plannedAt: "asc" }],
  });

  const postRootIds: string[] = [];
  const emailSingleSendIds: string[] = [];

  for (const action of actions) {
    if (action.type === ScheduledActionType.PUBLISH_POST) {
      postRootIds.push(action.targetId);
    } else if (action.type === ScheduledActionType.SEND_EMAIL) {
      emailSingleSendIds.push(action.targetId);
    }
  }

  const [latestPosts, emailSingleSends] = await Promise.all([
    postRootIds.length > 0
      ? db.post.findMany({
          where: { rootId: { in: postRootIds } },
          orderBy: [{ version: "desc" }],
          select: {
            rootId: true,
            title: true,
            version: true,
          },
        })
      : Promise.resolve([]),
    emailSingleSendIds.length > 0
      ? db.emailSingleSend.findMany({
          where: { id: { in: emailSingleSendIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const latestPostByRootId = new Map<string, { title: string }>();
  for (const post of latestPosts) {
    if (!post.rootId) continue;
    if (!latestPostByRootId.has(post.rootId)) {
      latestPostByRootId.set(post.rootId, { title: post.title });
    }
  }

  const emailById = new Map(emailSingleSends.map((e) => [e.id, e]));

  const actionEvents: CalendarEvent[] = actions.map((action) => {
    let title = "Unknown";

    if (action.type === ScheduledActionType.PUBLISH_POST) {
      const post = latestPostByRootId.get(action.targetId);
      title = post?.title ?? "Unknown post";
    } else if (action.type === ScheduledActionType.SEND_EMAIL) {
      const email = emailById.get(action.targetId);
      title = email?.name ?? "Unknown newsletter";
    }

    const start = resolveActionStart(action);

    return {
      id: action.id,
      type: action.type,
      title,
      start,
      end: addHours(start, 1),
      timezone: action.timezone,
      status: action.status,
      targetType: action.targetType,
      targetId: action.targetId,
      plannedAt: action.plannedAt,
      executedAt: action.executedAt,
      overdue: isOverdue(action),
      url: buildActionUrl(action.targetType, action.targetId),
    };
  });

  const includeManualPosts =
    !actionTypes ||
    actionTypes.length === 0 ||
    actionTypes.includes(ScheduledActionType.PUBLISH_POST);

  const includePublishedStatus =
    !statuses ||
    statuses.length === 0 ||
    statuses.includes("PUBLISHED" as CalendarEventStatus);

  if (!includeManualPosts || !includePublishedStatus) {
    return actionEvents;
  }

  const succeededPublications = new Set(
    actions
      .filter(
        (action) =>
          action.type === ScheduledActionType.PUBLISH_POST &&
          action.status === ScheduledActionStatus.SUCCEEDED &&
          action.executedAt,
      )
      .map((action) => `${action.targetId}:${action.executedAt!.getTime()}`),
  );

  const manualPosts = await db.post.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      isLatest: true,
      publishedAt: { gte: from, lt: to },
    },
    orderBy: [{ publishedAt: "desc" }],
    select: {
      id: true,
      rootId: true,
      title: true,
      publishedAt: true,
    },
  });

  const seenRootIds = new Set<string>();
  const manualEvents: CalendarEvent[] = [];

  for (const post of manualPosts) {
    if (!post.rootId) continue;
    if (seenRootIds.has(post.rootId)) continue;

    const key = `${post.rootId}:${post.publishedAt.getTime()}`;
    if (succeededPublications.has(key)) {
      continue;
    }

    seenRootIds.add(post.rootId);

    manualEvents.push({
      id: `manual:${post.rootId}`,
      type: ScheduledActionType.PUBLISH_POST,
      title: post.title,
      start: post.publishedAt,
      end: addHours(post.publishedAt, 1),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      status: "PUBLISHED" as CalendarEventStatus,
      targetType: "POST_ROOT",
      targetId: post.rootId,
      plannedAt: null,
      executedAt: post.publishedAt,
      overdue: false,
      url: buildManualPostUrl(post.rootId),
    });
  }

  return [...actionEvents, ...manualEvents].sort(
    (a, b) => a.start.getTime() - b.start.getTime(),
  );
}
