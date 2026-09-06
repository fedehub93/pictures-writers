import { createHash, timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { runScheduledActions } from "@/modules/scheduler/lib/scheduler-runner";
import { SECRET_HEADER } from "@/modules/scheduler/constants";
import { triggerWebhookBuild } from "@/lib/vercel";

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest();
}

function constantTimeCompare(a: string, b: string) {
  return timingSafeEqual(hashSecret(a), hashSecret(b));
}

// Vercel Hobby max execution time. 60s is the cap for legacy (non-fluid)
// functions and is safe on fluid compute too, with plenty of headroom for the
// cron worker: due actions left unfinished are reclaimed at the next 5-minute
// tick thanks to the action lease. If runs approach 60s (see function logs),
// enable fluid compute and raise this to 300s.
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const providedSecret = req.headers.get(SECRET_HEADER);
    const expectedSecret = process.env.SCHEDULED_PUBLICATION_SECRET;

    if (
      !expectedSecret ||
      !providedSecret ||
      !constantTimeCompare(providedSecret, expectedSecret)
    ) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // The external cron triggers the single common worker, which processes
    // due POST and newsletter actions together in one bounded batch.
    const result = await runScheduledActions();

    // Only successful Post publications request a rebuild; email sends never
    // trigger a Post build.
    const postPublished = result.details.some(
      (item) => item.type === "PUBLISH_POST" && item.status === "succeeded",
    );
    if (postPublished) {
      await triggerWebhookBuild();
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[SCHEDULER_RUN]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}