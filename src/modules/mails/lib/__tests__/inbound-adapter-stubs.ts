import type { EmailInboundAdapter } from "@/modules/mails/lib/types";

/**
 * No-op implementation of the inbound half of the provider contract. Test
 * fakes that only exercise outbound behavior can spread this in so they keep
 * satisfying `EmailProviderAdapter`.
 */
export const inboundAdapterStubs: EmailInboundAdapter = {
  verifyWebhook: () => ({ type: "ignored", data: null }),
  fetchInbound: async () => {
    throw new Error("fetchInbound is not implemented in this fake adapter");
  },
  listInboundAttachments: async () => [],
  getAttachmentDownloadUrl: async () => ({
    url: "https://example.test/attachment",
  }),
};
