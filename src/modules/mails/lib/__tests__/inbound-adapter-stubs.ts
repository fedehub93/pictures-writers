import type {
  EmailInboundAdapter,
  EmailProviderAdapter,
} from "@/modules/mails/lib/types";

/**
 * No-op implementation of the provider's inbound half plus `sendOneToOne`.
 * Test fakes that only exercise other behavior can spread this in so they keep
 * satisfying `EmailProviderAdapter`.
 */
export const inboundAdapterStubs: EmailInboundAdapter &
  Pick<EmailProviderAdapter, "sendOneToOne"> = {
  verifyWebhook: () => ({ type: "ignored", data: null }),
  fetchInbound: async () => {
    throw new Error("fetchInbound is not implemented in this fake adapter");
  },
  listInboundAttachments: async () => [],
  getAttachmentDownloadUrl: async () => ({
    url: "https://example.test/attachment",
  }),
  sendOneToOne: async () => ({ success: true, externalId: "stub-email-id" }),
};

/**
 * Complete no-op `EmailProviderAdapter`. Spread it into a fake and override the
 * methods under test.
 */
export const providerAdapterStubs: EmailProviderAdapter = {
  ...inboundAdapterStubs,
  syncSegment: async () => ({ errors: [] }),
  syncContactsBatch: async () => ({
    success: true,
    totalProcessed: 0,
    successfulCount: 0,
    failedCount: 0,
    errors: [],
    syncedContacts: [],
  }),
  addContactsToSegment: async () => ({
    success: true,
    totalProcessed: 0,
    successfulCount: 0,
    failedCount: 0,
    errors: [],
    syncedContacts: [],
  }),
  createContact: async () => ({ errors: [] }),
  deleteContact: async () => ({ errors: [] }),
  upsertContact: async () => ({ errors: [], externalId: "stub-external-id" }),
  deleteSegment: async () => ({ errors: [] }),
  sendBulk: async () => ({ success: true, externalCampaignId: "stub-campaign" }),
};
