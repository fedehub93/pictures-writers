import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { AUTOMATION_SECRET_HEADER } from "@/modules/automations/constants";
import { unconfiguredEffects } from "@/modules/automations/lib/effects";
import { runDueAutomations } from "@/modules/automations/lib/automation-runner";
import { enqueueDueCronAutomations } from "@/modules/automations/lib/automation-triggers";
import {
  createAutomationMailEffect,
  sendEmailNodeRegistry,
} from "@/modules/mails/automations";

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function constantTimeCompare(a: string, b: string) {
  return timingSafeEqual(hashSecret(a), hashSecret(b));
}

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const providedSecret = request.headers.get(AUTOMATION_SECRET_HEADER);
    const expectedSecret = process.env.SCHEDULED_PUBLICATION_SECRET;

    if (
      !expectedSecret ||
      !providedSecret ||
      !constantTimeCompare(providedSecret, expectedSecret)
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const cron = await enqueueDueCronAutomations();
    const result = await runDueAutomations({
      registry: sendEmailNodeRegistry,
      effects: {
        ...unconfiguredEffects,
        mail: createAutomationMailEffect(),
      },
    });
    return NextResponse.json({ ...result, cron });
  } catch (error) {
    console.error("[AUTOMATIONS_RUN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
