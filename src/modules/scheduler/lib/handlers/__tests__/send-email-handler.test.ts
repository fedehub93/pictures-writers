import { randomUUID } from "node:crypto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { db } from "@/shared/lib/db";
import { ScheduledActionType } from "@/generated/prisma";
import {
  createScheduledAction,
  createIdempotencyKey,
} from "@/modules/scheduler/lib/scheduled-action-repository";
import { SCHEDULER_TARGET_TYPES } from "@/modules/scheduler/constants";

import { handleSendEmail } from "../send-email-handler";
import * as sendSingleSendModule from "@/modules/mails/single-sends/lib/send-single-send";

describe("handleSendEmail", () => {
  const createdActionIds: string[] = [];

  beforeEach(async () => {
    await db.scheduledAction.deleteMany({});
    createdActionIds.length = 0;
    vi.restoreAllMocks();
  });

  afterEach(async () => {
    if (createdActionIds.length > 0) {
      await db.scheduledAction.deleteMany({
        where: { id: { in: createdActionIds } },
      });
      createdActionIds.length = 0;
    }
  });

  const createEmailAction = async (singleSendId: string) => {
    const action = await createScheduledAction({
      type: ScheduledActionType.SEND_EMAIL,
      targetType: SCHEDULER_TARGET_TYPES.EMAIL_SINGLE_SEND,
      targetId: singleSendId,
      plannedAt: new Date("2025-06-01T10:00:00.000Z"),
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

  it("calls sendSingleSend with the action idempotency key", async () => {
    const singleSendId = randomUUID();
    const action = await createEmailAction(singleSendId);

    const sendSpy = vi
      .spyOn(sendSingleSendModule, "sendSingleSend")
      .mockResolvedValue({ providerId: "provider-123" });

    const result = await handleSendEmail(action);

    expect(sendSpy).toHaveBeenCalledWith({
      singleSendId,
      idempotencyKey: action.idempotencyKey,
    });
    expect(result.providerId).toBe("provider-123");
  });

  it("converts permanent email errors to non-retryable handler errors", async () => {
    const singleSendId = randomUUID();
    const action = await createEmailAction(singleSendId);

    vi.spyOn(sendSingleSendModule, "sendSingleSend").mockRejectedValue(
      new sendSingleSendModule.EmailSendError("Missing subject", false),
    );

    await expect(handleSendEmail(action)).rejects.toSatisfy(
      (error: Error & { transient?: boolean }) => error.transient === false,
    );
  });

  it("converts transient email errors to retryable handler errors", async () => {
    const singleSendId = randomUUID();
    const action = await createEmailAction(singleSendId);

    vi.spyOn(sendSingleSendModule, "sendSingleSend").mockRejectedValue(
      new sendSingleSendModule.EmailSendError("Provider timeout", true),
    );

    await expect(handleSendEmail(action)).rejects.toSatisfy(
      (error: Error & { transient?: boolean }) => error.transient === true,
    );
  });

  it("guards against unexpected target types", async () => {
    const action = await createScheduledAction({
      type: ScheduledActionType.SEND_EMAIL,
      targetType: "POST_ROOT",
      targetId: randomUUID(),
      plannedAt: new Date("2025-06-01T10:00:00.000Z"),
      timezone: "UTC",
      idempotencyKey: randomUUID(),
    });
    createdActionIds.push(action.id);

    await expect(handleSendEmail(action)).rejects.toSatisfy(
      (error: Error & { transient?: boolean }) => error.transient === false,
    );
  });
});
