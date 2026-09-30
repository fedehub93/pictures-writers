import "server-only";

import { NextResponse } from "next/server";

import { AUTOMATION_WEBHOOK_SECRET_HEADER } from "@/modules/automations/constants";
import { enqueueWebhookRun } from "@/modules/automations/lib/automation-triggers";

export const maxDuration = 60;

type RouteParams = { params: Promise<{ automationId: string }> };

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/**
 * Inbound webhook endpoint for the Webhook trigger. The caller presents the
 * raw secret in the `x-automation-secret` header; the route authenticates it in
 * constant time against the Automation's stored hash and starts a Run with the
 * request body as payload.
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { automationId } = await params;
    const secret = request.headers.get(AUTOMATION_WEBHOOK_SECRET_HEADER);
    const payload = await readJsonBody(request);

    const result = await enqueueWebhookRun({ automationId, secret, payload });

    if (result.status === "unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json({
      runId: result.status === "accepted" ? result.runId : null,
    });
  } catch (error) {
    console.error("[AUTOMATIONS_WEBHOOK]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
