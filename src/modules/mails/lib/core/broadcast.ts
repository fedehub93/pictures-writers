import { resolveAdapter } from "../provider";

export async function sendBulk({
  segmentExternalId,
  subject,
  html,
  from,
  replyTo,
  idempotencyKey,
}: {
  segmentExternalId: string;
  subject: string;
  html: string;
  from: string;
  replyTo?: string;
  idempotencyKey?: string;
}) {
  // Inizializzazione dell'Adapter (es. ResendAdapter, MailchimpAdapter, ecc.)
  const adapter = await resolveAdapter();

  const providerResult = await adapter.sendBulk({
    segmentExternalId,
    subject,
    html,
    from,
    replyTo,
    idempotencyKey,
  });

  return providerResult;
}
