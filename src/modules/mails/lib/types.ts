// lib/mail/types.ts

export type GenericEmail = {
  to: string;
  from: string;
  subject: string;
  type: string;
  replyTo?: string;
  text?: string;
  html?: string;
};

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

export type CreateContactResult = {
  errors: string[];
  newExternalId?: string;
};

export type DeleteContactResult = {
  errors: string[];
};

export interface EmailProviderAdapter {
  syncSegment(externalId: string | null, name: string): Promise<SyncResult>;
  syncContactsBatch(
    contacts: {
      email: string;
      id: string;
      firstName?: string | null;
      lastName?: string | null;
      isSubscriber?: boolean;
      audiences?: { externalId: string | null }[];
    }[],
  ): Promise<BatchSyncResult>;
  createContact(
    email: string,
    id: string,
    firstName?: string | null,
    lastName?: string | null,
    isSubscriber?: boolean,
    audiences?: { externalId: string | null }[],
  ): Promise<CreateContactResult>;
  deleteContact(email: string): Promise<DeleteContactResult>;
  sendBulk(params: {
    segmentExternalId: string;
    subject: string;
    html: string;
    from: string;
    replyTo?: string;
  }): Promise<{
    success: boolean;
    externalCampaignId?: string;
    error?: string;
  }>;
}
