import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { db } from "@/shared/lib/db";
import {
  ScheduledActionStatus,
  ScheduledActionType,
} from "@/generated/prisma";

import {
  scheduleSingleSend,
  rescheduleSingleSend,
  cancelScheduledSingleSend,
  SingleSendScheduleError,
} from "../schedule-single-send";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

describe("single send scheduling", () => {
  const createdSingleSendIds: string[] = [];
  const createdActionIds: string[] = [];

  const createSingleSend = async () => {
    const singleSend = await db.emailSingleSend.create({
      data: { name: "Test Newsletter" },
    });
    createdSingleSendIds.push(singleSend.id);
    return singleSend;
  };

  beforeEach(async () => {
    await db.scheduledAction.deleteMany({});
    await db.emailSingleSend.deleteMany({});
    createdSingleSendIds.length = 0;
    createdActionIds.length = 0;
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
    createdActionIds.length = 0;
    createdSingleSendIds.length = 0;
  });

  it("creates a SEND_EMAIL scheduled action", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const scheduledAt = new Date("2025-06-01T11:05:00.000Z");
    const singleSend = await createSingleSend();

    const action = await scheduleSingleSend({
      singleSendId: singleSend.id,
      scheduledAt,
      timezone: "Europe/Rome",
      now,
    });
    createdActionIds.push(action.id);

    expect(action.type).toBe(ScheduledActionType.SEND_EMAIL);
    expect(action.targetType).toBe(SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND);
    expect(action.targetId).toBe(singleSend.id);
    expect(action.status).toBe(ScheduledActionStatus.SCHEDULED);
    expect(action.plannedAt.toISOString()).toBe(scheduledAt.toISOString());
    expect(action.timezone).toBe("Europe/Rome");
    expect(action.active).toBe(true);
  });

  it("rejects dates in the past", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const singleSend = await createSingleSend();

    await expect(
      scheduleSingleSend({
        singleSendId: singleSend.id,
        scheduledAt: new Date("2025-06-01T09:00:00.000Z"),
        now,
      }),
    ).rejects.toBeInstanceOf(SingleSendScheduleError);
  });

  it("rejects times that are not five-minute intervals", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const singleSend = await createSingleSend();

    await expect(
      scheduleSingleSend({
        singleSendId: singleSend.id,
        scheduledAt: new Date("2025-06-01T11:03:00.000Z"),
        now,
      }),
    ).rejects.toBeInstanceOf(SingleSendScheduleError);
  });

  it("prevents two active schedules for the same single send", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const singleSend = await createSingleSend();

    const first = await scheduleSingleSend({
      singleSendId: singleSend.id,
      scheduledAt: new Date("2025-06-01T11:05:00.000Z"),
      now,
    });
    createdActionIds.push(first.id);

    await expect(
      scheduleSingleSend({
        singleSendId: singleSend.id,
        scheduledAt: new Date("2025-06-01T12:05:00.000Z"),
        now,
      }),
    ).rejects.toBeInstanceOf(SingleSendScheduleError);
  });

  it("does not create two active schedules under concurrency", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const singleSend = await createSingleSend();
    const scheduledAt = new Date("2025-06-01T11:05:00.000Z");

    const results = await Promise.allSettled([
      scheduleSingleSend({ singleSendId: singleSend.id, scheduledAt, now }),
      scheduleSingleSend({ singleSendId: singleSend.id, scheduledAt, now }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);

    const active = await db.scheduledAction.findMany({
      where: { targetId: singleSend.id, active: true },
    });
    expect(active).toHaveLength(1);

    for (const action of active) {
      createdActionIds.push(action.id);
    }
  });

  it("allows a new schedule after the previous one is canceled", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const singleSend = await createSingleSend();

    const first = await scheduleSingleSend({
      singleSendId: singleSend.id,
      scheduledAt: new Date("2025-06-01T11:05:00.000Z"),
      now,
    });
    createdActionIds.push(first.id);

    await cancelScheduledSingleSend({ singleSendId: singleSend.id });

    const second = await scheduleSingleSend({
      singleSendId: singleSend.id,
      scheduledAt: new Date("2025-06-01T12:05:00.000Z"),
      now,
    });
    createdActionIds.push(second.id);

    expect(second.id).not.toBe(first.id);

    const firstAfterCancel = await db.scheduledAction.findUnique({
      where: { id: first.id },
    });
    expect(firstAfterCancel?.status).toBe(ScheduledActionStatus.CANCELED);
    expect(firstAfterCancel?.active).toBe(false);
  });

  it("reschedules an active send", async () => {
    const now = new Date("2025-06-01T10:00:00.000Z");
    const singleSend = await createSingleSend();

    const first = await scheduleSingleSend({
      singleSendId: singleSend.id,
      scheduledAt: new Date("2025-06-01T11:05:00.000Z"),
      now,
    });
    createdActionIds.push(first.id);

    const newScheduledAt = new Date("2025-06-01T13:10:00.000Z");
    const rescheduled = await rescheduleSingleSend({
      singleSendId: singleSend.id,
      scheduledAt: newScheduledAt,
      timezone: "UTC",
      now,
    });

    expect(rescheduled.id).toBe(first.id);
    expect(rescheduled.plannedAt.toISOString()).toBe(
      newScheduledAt.toISOString(),
    );
    expect(rescheduled.status).toBe(ScheduledActionStatus.SCHEDULED);
    expect(rescheduled.attempts).toBe(0);
  });
});
