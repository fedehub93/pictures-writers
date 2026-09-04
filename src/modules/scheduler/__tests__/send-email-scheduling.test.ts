import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { db } from "@/shared/lib/db";
import { ScheduledActionStatus, ScheduledActionType } from "@/generated/prisma";
import { runScheduledActions } from "@/modules/scheduler/lib/scheduler-runner";
import {
  createScheduledAction,
  createIdempotencyKey,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";
import { getCalendarEvents } from "@/modules/scheduler/lib/calendar-query";

import * as sendSingleSendModule from "@/modules/mails/single-sends/lib/send-single-send";

describe("scheduler runner with email sends", () => {
  const createdSingleSendIds: string[] = [];
  const createdAudienceIds: string[] = [];
  const createdActionIds: string[] = [];

  beforeEach(async () => {
    await db.scheduledAction.deleteMany({});
    await db.emailSingleSend.deleteMany({});
    await db.emailAudience.deleteMany({});
    createdSingleSendIds.length = 0;
    createdAudienceIds.length = 0;
    createdActionIds.length = 0;
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    if (createdActionIds.length > 0) {
      await db.scheduledAction.deleteMany({
        where: { id: { in: createdActionIds } },
      });
    }
    if (createdSingleSendIds.length > 0) {
      await db.emailSingleSend.deleteMany({
        where: { id: { in: createdSingleSendIds } },
      });
    }
    if (createdAudienceIds.length > 0) {
      await db.emailAudience.deleteMany({
        where: { id: { in: createdAudienceIds } },
      });
    }
    createdActionIds.length = 0;
    createdSingleSendIds.length = 0;
    createdAudienceIds.length = 0;
  });

  const createEmailFixture = async () => {
    const audience = await db.emailAudience.create({
      data: {
        name: "Test Audience",
        externalId: `aud-${randomUUID()}`,
      },
    });
    createdAudienceIds.push(audience.id);

    const singleSend = await db.emailSingleSend.create({
      data: {
        name: "Scheduled Newsletter",
        subject: "Subject",
        bodyHtml: "<p>Body</p>",
        audiences: { connect: { id: audience.id } },
      },
    });
    createdSingleSendIds.push(singleSend.id);

    return { audience, singleSend };
  };

  const createEmailAction = async (singleSendId: string, plannedAt: Date) => {
    const action = await createScheduledAction({
      type: ScheduledActionType.SEND_EMAIL,
      targetType: SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
      targetId: singleSendId,
      plannedAt,
      timezone: "UTC",
      idempotencyKey: createIdempotencyKey(
        ScheduledActionType.SEND_EMAIL,
        SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
        singleSendId,
      ),
    });
    createdActionIds.push(action.id);
    return action;
  };

  it("sends a due newsletter through the worker and records provider metadata", async () => {
    const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
    const runAt = new Date("2025-06-01T12:00:00.000Z");

    const { singleSend } = await createEmailFixture();
    const action = await createEmailAction(singleSend.id, scheduledAt);

    const sendSpy = vi
      .spyOn(sendSingleSendModule, "sendSingleSend")
      .mockResolvedValue({ providerId: "campaign-123" });

    const result = await runScheduledActions({ now: runAt });

    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);

    const updated = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });
    expect(updated?.status).toBe(ScheduledActionStatus.SUCCEEDED);
    expect(updated?.providerId).toBe("campaign-123");
    expect(updated?.executedAt).not.toBeNull();
    expect(updated?.active).toBe(false);

    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy).toHaveBeenCalledWith({
      singleSendId: singleSend.id,
      idempotencyKey: action.idempotencyKey,
    });
  });

  it("does not send the same newsletter twice after success (idempotency)", async () => {
    const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
    const runAt = new Date("2025-06-01T12:00:00.000Z");

    const { singleSend } = await createEmailFixture();
    await createEmailAction(singleSend.id, scheduledAt);

    const sendSpy = vi
      .spyOn(sendSingleSendModule, "sendSingleSend")
      .mockResolvedValue({ providerId: "campaign-123" });

    const first = await runScheduledActions({ now: runAt });
    const second = await runScheduledActions({
      now: new Date("2025-06-01T13:00:00.000Z"),
    });

    expect(first.processed).toBe(1);
    expect(second.processed).toBe(0);
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  it("retries transient provider failures with the same idempotency key", async () => {
    const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
    const runAt = new Date("2025-06-01T12:00:00.000Z");

    const { singleSend } = await createEmailFixture();
    const action = await createEmailAction(singleSend.id, scheduledAt);

    const sendSpy = vi
      .spyOn(sendSingleSendModule, "sendSingleSend")
      .mockRejectedValueOnce(
        new sendSingleSendModule.EmailSendError("Provider timeout", true),
      )
      .mockResolvedValueOnce({ providerId: "campaign-456" });

    await runScheduledActions({ now: runAt });

    const afterFirst = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });
    expect(afterFirst?.status).toBe(ScheduledActionStatus.RETRY_WAIT);
    expect(afterFirst?.attempts).toBe(1);
    expect(afterFirst?.retryAt).not.toBeNull();

    const retryRun = await runScheduledActions({
      now: new Date(afterFirst!.retryAt!.getTime() + 1000),
    });

    expect(retryRun.succeeded).toBe(1);

    const afterRetry = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });
    expect(afterRetry?.status).toBe(ScheduledActionStatus.SUCCEEDED);
    expect(afterRetry?.attempts).toBe(2);
    expect(afterRetry?.providerId).toBe("campaign-456");

    const firstCall = sendSpy.mock.calls[0]![0]!;
    const secondCall = sendSpy.mock.calls[1]![0]!;
    expect(firstCall.idempotencyKey).toBe(action.idempotencyKey);
    expect(secondCall.idempotencyKey).toBe(action.idempotencyKey);
  });

  it("marks permanent email failures as terminally FAILED without retry", async () => {
    const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
    const runAt = new Date("2025-06-01T12:00:00.000Z");

    const { singleSend } = await createEmailFixture();
    const action = await createEmailAction(singleSend.id, scheduledAt);

    vi.spyOn(sendSingleSendModule, "sendSingleSend").mockRejectedValue(
      new sendSingleSendModule.EmailSendError("Invalid segment", false),
    );

    const result = await runScheduledActions({ now: runAt });

    expect(result.processed).toBe(1);
    expect(result.failed).toBe(1);

    const updated = await db.scheduledAction.findUnique({
      where: { id: action.id },
    });
    expect(updated?.status).toBe(ScheduledActionStatus.FAILED);
    expect(updated?.active).toBe(false);
    expect(updated?.lastError).toBe("Invalid segment");
  });

  it("does not let one failed email block other due actions", async () => {
    const scheduledAt = new Date("2025-06-01T11:00:00.000Z");
    const runAt = new Date("2025-06-01T12:00:00.000Z");

    const { singleSend } = await createEmailFixture();
    await createEmailAction(singleSend.id, scheduledAt);

    vi.spyOn(sendSingleSendModule, "sendSingleSend").mockImplementation(
      async ({ singleSendId: id }) => {
        if (id === singleSend.id) {
          throw new sendSingleSendModule.EmailSendError(
            "Invalid segment",
            false,
          );
        }
        return { providerId: "campaign-ok" };
      },
    );

    const secondSingleSend = await db.emailSingleSend.create({
      data: {
        name: "Second Newsletter",
        subject: "Subject 2",
        bodyHtml: "<p>Body 2</p>",
      },
    });
    createdSingleSendIds.push(secondSingleSend.id);

    const secondAction = await createScheduledAction({
      type: ScheduledActionType.SEND_EMAIL,
      targetType: SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
      targetId: secondSingleSend.id,
      plannedAt: scheduledAt,
      timezone: "UTC",
      idempotencyKey: createIdempotencyKey(
        ScheduledActionType.SEND_EMAIL,
        SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
        secondSingleSend.id,
      ),
    });
    createdActionIds.push(secondAction.id);

    const result = await runScheduledActions({ now: runAt });

    expect(result.processed).toBe(2);
    expect(result.failed).toBe(1);
    expect(result.succeeded).toBe(1);
  });

  it("keeps email send history available when the same send is reused", async () => {
    const from = new Date("2025-06-01T00:00:00.000Z");
    const to = new Date("2025-06-03T00:00:00.000Z");

    const { singleSend } = await createEmailFixture();

    const succeeded = await createEmailAction(
      singleSend.id,
      new Date("2025-06-01T11:00:00.000Z"),
    );
    await db.scheduledAction.update({
      where: { id: succeeded.id },
      data: {
        status: ScheduledActionStatus.SUCCEEDED,
        executedAt: new Date("2025-06-01T11:05:00.000Z"),
        active: false,
        providerId: "campaign-old",
      },
    });

    const canceled = await createEmailAction(
      singleSend.id,
      new Date("2025-06-01T13:00:00.000Z"),
    );
    await db.scheduledAction.update({
      where: { id: canceled.id },
      data: {
        status: ScheduledActionStatus.CANCELED,
        active: false,
        canceledAt: new Date("2025-06-01T12:00:00.000Z"),
      },
    });

    const rescheduled = await createEmailAction(
      singleSend.id,
      new Date("2025-06-02T09:05:00.000Z"),
    );

    const events = await getCalendarEvents({ from, to });

    const emailEventStatuses = events
      .filter((event) => event.type === ScheduledActionType.SEND_EMAIL)
      .map((event) => event.status)
      .sort();

    expect(events).toHaveLength(3);
    expect(emailEventStatuses).toEqual([
      ScheduledActionStatus.CANCELED,
      ScheduledActionStatus.SCHEDULED,
      ScheduledActionStatus.SUCCEEDED,
    ]);

    const allEventsForTarget = events.filter(
      (event) =>
        event.type === ScheduledActionType.SEND_EMAIL &&
        event.targetId === singleSend.id,
    );
    expect(allEventsForTarget).toHaveLength(3);
    expect(rescheduled.status).toBe(ScheduledActionStatus.SCHEDULED);
  });
});
