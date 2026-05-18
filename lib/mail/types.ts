// lib/mail/types.ts
export interface SyncResult {
  errors: string[];
  newExternalId?: string; // Aggiunto per restituire il nuovo ID al DB locale
}

export type SyncErrorDetail = {
  email: string;
  reason: string;
};

export type BatchSyncResult = {
  success: boolean; // true se TUTTI i contatti sono stati sincronizzati senza errori
  totalProcessed: number; // Quanti contatti hai tentato di inviare
  successfulCount: number; // Quanti sono andati a buon fine
  failedCount: number; // Quanti hanno generato un errore
  errors: SyncErrorDetail[]; // Dettaglio degli errori per il log o per la UI
};

export interface EmailProviderAdapter {
  syncSegment(externalId: string | null, name: string): Promise<SyncResult>;
  syncContactsBatch(
    segmentExternalId: string,
    contacts: {
      email: string;
      firstName?: string | null;
      lastName?: string | null;
      isSubscriber?: boolean;
    }[],
  ): Promise<BatchSyncResult>;
}
