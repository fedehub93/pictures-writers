// lib/mail/adapters/resend-adapter.ts
import { Resend } from "resend";
import { BatchSyncResult, EmailProviderAdapter, SyncResult } from "../types";
import { db } from "@/lib/db";

// const resend = new Resend(process.env.NEXT_RESEND_KEY);

// Helper utility per mettere in pausa l'esecuzione
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class ResendAdapter implements EmailProviderAdapter {
  private resendClient: Resend;

  constructor() {
    if (!process.env.NEXT_RESEND_KEY) {
      throw new Error("NEXT_RESEND_KEY is missing in environment variables");
    }
    this.resendClient = new Resend(process.env.NEXT_RESEND_KEY);
  }

  async syncSegment(
    externalId: string | null,
    name: string,
  ): Promise<SyncResult> {
    const errors: string[] = [];

    let currentSegmentId = externalId;
    let newExternalId: string | undefined = undefined;

    // 1. GESTIONE AUDIENCE: Se non esiste, la creiamo su Resend
    if (!currentSegmentId) {
      try {
        const { data, error } = await this.resendClient.segments.create({
          name: name,
        });
        if (error || !data) {
          throw new Error(
            error?.message ||
              "Errore sconosciuto durante la creazione dell'Audience",
          );
        }

        newExternalId = data.id; // Salviamo il nuovo ID per restituirlo al nostro CMS
      } catch (e: any) {
        return {
          errors: [`Impossibile creare l'audience: ${e.message}`],
        };
      }
    }

    return { errors, newExternalId };
  }
  async syncContactsBatch(
    segmentExternalId: string, // Questo funge da segmentId
    contacts: {
      email: string;
      firstName?: string;
      lastName?: string;
      isSubscriber?: boolean;
    }[],
  ): Promise<BatchSyncResult> {
    const result: BatchSyncResult = {
      success: false,
      totalProcessed: contacts.length,
      successfulCount: 0,
      failedCount: 0,
      errors: [],
    };

    if (contacts.length === 0) {
      result.success = true;
      return result;
    }

    // 1. Limite rigoroso adattato: 5 contatti = 10 API calls totali per ciclo
    const CHUNK_SIZE = 5;
    const RATE_LIMIT_DELAY_MS = 1050;

    for (let i = 0; i < contacts.length; i += CHUNK_SIZE) {
      const chunk = contacts.slice(i, i + CHUNK_SIZE);

      // Prepariamo fino a 5 workflow simultanei
      const promises = chunk.map(async (contact) => {
        // STEP A: Crea o aggiorna il contatto
        const createResponse = await this.resendClient.contacts.create({
          email: contact.email,
          firstName: contact.firstName || undefined,
          lastName: contact.lastName || undefined,
          unsubscribed: !contact.isSubscriber,
        });

        // Se la creazione fallisce, restituiamo l'errore e interrompiamo il flusso per questo contatto
        if (createResponse.error) {
          return { error: createResponse.error };
        }

        // Estraiamo l'ID generato da Resend
        const contactId = createResponse.data?.id;
        if (!contactId) {
          return { error: { message: "Contact ID non restituito da Resend" } };
        }

        // STEP B: Aggiungi il contatto appena creato al Segmento
        const segmentResponse = await this.resendClient.contacts.segments.add({
          contactId: contactId,
          segmentId: segmentExternalId,
        });

        // Se l'aggiunta fallisce, restituiamo questo come errore
        if (segmentResponse.error) {
          return { error: segmentResponse.error };
        }

        // Se entrambi gli step passano, dichiariamo il successo
        return { data: segmentResponse.data };
      });

      // Eseguiamo i 5 workflow (10 chiamate di rete in totale)
      const settledResults = await Promise.allSettled(promises);

      for (const [index, promiseResult] of settledResults.entries()) {
        const originalContact = chunk[index];

        if (promiseResult.status === "fulfilled") {
          // La nostra funzione wrapper restituisce un oggetto unificato { error } o { data }
          const resendResponse = promiseResult.value;

          if (resendResponse.error) {
            result.failedCount++;
            result.errors.push({
              email: originalContact.email,
              reason: resendResponse.error.message,
            });
          } else {
            result.successfulCount++;
          }
        } else {
          result.failedCount++;
          result.errors.push({
            email: originalContact.email,
            reason: promiseResult.reason?.message || "Errore di rete critico",
          });
        }
      }

      // 2. Controllo Vitale: Pausa forzata per resettare il Rate Limit
      if (i + CHUNK_SIZE < contacts.length) {
        await sleep(RATE_LIMIT_DELAY_MS);
      }
    }

    // 5. Determiniamo il successo globale dell'operazione
    result.success = result.failedCount === 0;

    return result;
  }
}
