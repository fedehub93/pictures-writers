import { NextResponse } from "next/server";

import {
  INTEGRATION_PROVIDER_RESEND,
  IntegrationResolutionError,
  resolveIntegrationSecrets,
  withIntegrationResolutionCache,
} from "@/modules/integrations/lib";
import { resolveAdapter } from "@/modules/mails/lib/provider";
import {
  isReceivedEmailEvent,
  type EmailProviderAdapter,
  type VerifiedWebhookEvent,
} from "@/modules/mails/lib/types";
import { createUploadThingStorage } from "@/modules/mails/conversations/lib/attachment-storage";
import { handleInboundEmail } from "@/modules/mails/conversations/lib/handle-inbound-email";

const TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

function isTimestampWithinTolerance(timestamp: string): boolean {
  if (!/^\d+$/.test(timestamp)) {
    return false;
  }

  const seconds = Number(timestamp);
  if (!Number.isFinite(seconds)) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.abs(nowSeconds - seconds) <= TIMESTAMP_TOLERANCE_SECONDS;
}

function notConfiguredResponse() {
  return NextResponse.json({ status: "not_configured" }, { status: 200 });
}

/**
 * Resend inbound webhook. Verifies the Svix signature with the webhook secret
 * resolved from the Resend integration, then routes `email.received` events to
 * the inbound handler. The webhook payload only carries metadata; the handler
 * fetches the body and attachments.
 */
export function POST(req: Request) {
  return withIntegrationResolutionCache(() => handleWebhook(req));
}

async function handleWebhook(req: Request) {
  const payload = await req.text();

  const id = req.headers.get("svix-id");
  const timestamp = req.headers.get("svix-timestamp");
  const signature = req.headers.get("svix-signature");

  if (!id || !timestamp || !signature) {
    return NextResponse.json(
      { error: "Missing webhook signature" },
      { status: 400 },
    );
  }

  let webhookSecret: string | undefined;
  try {
    const secrets = await resolveIntegrationSecrets(INTEGRATION_PROVIDER_RESEND);
    webhookSecret = secrets.webhookSecret;
  } catch (error) {
    if (
      error instanceof IntegrationResolutionError &&
      error.reason === "not_configured"
    ) {
      return notConfiguredResponse();
    }

    console.error("[RESEND_INBOUND_WEBHOOK]", error);
    return NextResponse.json(
      { error: "Failed to resolve email provider" },
      { status: 500 },
    );
  }

  if (!webhookSecret) {
    return notConfiguredResponse();
  }

  if (!isTimestampWithinTolerance(timestamp)) {
    return NextResponse.json(
      { error: "Invalid webhook timestamp" },
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
