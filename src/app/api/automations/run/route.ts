import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { AUTOMATION_SECRET_HEADER } from "@/modules/automations/constants";
import { enqueueDueCronAutomations } from "@/modules/automations/lib/automation-triggers";
import { pumpDueAutomations } from "@/modules/automations/server/automation-runtime";
import { getSiteTimeZone } from "@/modules/automations/server/site-time-zone";

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

    const timeZone = await getSiteTimeZone();

    // Trigger evaluation and step execution are independent: a failure to
    // evaluate cron triggers must not stop already-enqueued Runs from draining.
    const cron = await enqueueDueCronAutomations({ timeZone }).catch((error) => {
      console.error("[AUTOMATIONS_CRON]", error);
      return { fired: [] };
    });
    const result = await pumpDueAutomations({ timeZone });
    return NextResponse.json({ ...result, cron });
  } catch (error) {
    console.error("[AUTOMATIONS_RUN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
