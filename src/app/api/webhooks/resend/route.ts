import { NextResponse } from "next/server";

import { resolveAdapter } from "@/modules/mails/lib/provider";
import {
  isReceivedEmailEvent,
  type EmailProviderAdapter,
  type VerifiedWebhookEvent,
} from "@/modules/mails/lib/types";
import { createUploadThingStorage } from "@/modules/mails/conversations/lib/attachment-storage";
import { handleInboundEmail } from "@/modules/mails/conversations/lib/handle-inbound-email";

/**
 * Resend inbound webhook. Verifies the Svix signature, then routes
 * `email.received` events to the inbound handler. The webhook payload only
 * carries metadata; the handler fetches the body and attachments.
 */
export async function POST(req: Request) {
  const payload = await req.text();

  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");
  const webhookSecret = process.env.NEXT_RESEND_WEBHOOK_SECRET;

  if (!webhookSecret || !id || !timestamp || !signature) {
    return NextResponse.json(
      { error: "Missing webhook signature" },
      { status: 400 },
    );
  }

  let adapter: EmailProviderAdapter;
  try {
    adapter = await resolveAdapter();
  } catch {
    return NextResponse.json(
      { error: "Email provider is not configured" },
      { status: 500 },
    );
  }

  let event: VerifiedWebhookEvent;
  try {
    event = adapter.verifyWebhook({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (!isReceivedEmailEvent(event)) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  try {
    const result = await handleInboundEmail(event.data, {
      adapter,
      storage: createUploadThingStorage(),
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[RESEND_INBOUND_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Failed to process inbound email" },
      { status: 500 },
    );
  }
}
