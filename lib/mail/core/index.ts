// lib/marketing/core/syncFacade.ts
import { db } from "@/lib/db";
import { ResendAdapter } from "../adapters/resend-adapter";
import { EmailProviderAdapter } from "../types";

export async function syncAudienceWithProvider(
  audienceId: string,
  skip: number,
  take: number,
) {
  // 1. Recupero Dati dal Database
  const audience = await db.emailAudience.findUnique({
    where: { id: audienceId },
    select: {
      id: true,
      name: true,
      externalId: true,
      contacts: {
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isSubscriber: true,
        },
      },
    },
  });

  if (!audience) {
    throw new Error("Audience not found or not linked");
  }

  const emailSettings = await db.emailSetting.findFirst();
  if (!emailSettings || !emailSettings.emailProvider) {
    throw new Error("Settings is incorrect");
  }

  let externalId = audience.externalId;

  // 2. Inizializzazione dinamica dell'Adapter (Factory)
  const adapter = getProviderAdapter(emailSettings.emailProvider);
  // 3. Esecuzione granulare della sincronizzazione
  // A. Aggiorniamo i dettagli dell'Audience (es. cambio nome)
  if (!externalId) {
    const segmentResult = await adapter.syncSegment(
      audience.externalId,
      audience.name,
    );

    if (!segmentResult.newExternalId) {
      throw new Error("Segment not created");
    }

    externalId = segmentResult.newExternalId;

    await db.emailAudience.update({
      where: { id: audience.id },
      data: { externalId },
    });
  }

  // B. Aggiorniamo l'elenco contatti associato
  const result = await adapter.syncContactsBatch(externalId, audience.contacts);

  return result;
}

// Factory Helper per isolare lo switch dei provider
function getProviderAdapter(providerType: string): EmailProviderAdapter {
  switch (providerType) {
    case "RESEND":
      return new ResendAdapter();
    case "SENDGRID":
      throw new Error("SendGrid is not integrated yet");
    default:
      throw new Error("Provider not supported");
  }
}
