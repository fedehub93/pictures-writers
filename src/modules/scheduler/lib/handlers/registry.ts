import "server-only";

import { ScheduledActionType } from "@/generated/prisma";
import type { ScheduledAction } from "@/generated/prisma";

import { ScheduledActionHandlerError } from "../../constants";

import { handlePublishPost } from "./post-publish-handler";
import { handleSendEmail } from "./send-email-handler";

export type ScheduledActionHandler = (
  action: ScheduledAction,
  context: { now?: Date },
) => Promise<void | { providerId?: string }>;

export type HandlerRegistry = Record<ScheduledActionType, ScheduledActionHandler>;

const handlers: HandlerRegistry = {
  PUBLISH_POST: handlePublishPost,
  SEND_EMAIL: handleSendEmail,
};

export function getHandler(type: ScheduledActionType): ScheduledActionHandler {
  const handler = handlers[type];
  if (!handler) {
    throw new ScheduledActionHandlerError(
      `No handler registered for action type ${type}`,
      false,
    );
  }
  return handler;
}
