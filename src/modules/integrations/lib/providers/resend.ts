import * as z from "zod";

import { ResendIntegrationForm } from "@/modules/integrations/ui/components/providers/resend-form";
import { ResendIcon } from "@/modules/integrations/ui/components/providers/resend-icon";

import { INTEGRATION_PROVIDER_RESEND } from "../constants";
import type { IntegrationProviderDescriptor } from "./types";

const resendSecretsSchema = z.object({
  apiKey: z.string().min(1).optional(),
  webhookSecret: z.string().min(1).optional(),
});

const resendSecretFields = [
  { key: "apiKey", label: "API key", required: true },
  { key: "webhookSecret", label: "Webhook secret", required: false },
];

export const resendIntegrationDescriptor: IntegrationProviderDescriptor = {
  provider: INTEGRATION_PROVIDER_RESEND,
  presentation: {
    name: "Resend",
    description:
      "Send transactional and marketing email, and receive inbound mail through webhooks.",
    Icon: ResendIcon,
  },
  configSchema: z.object({}),
  secretsSchema: resendSecretsSchema,
  secretFields: resendSecretFields,
  affectsPublicSite: false,
  isReady: ({ secretKeys }) =>
    resendSecretFields.every(
      (field) => !field.required || secretKeys.includes(field.key),
    ),
  adminForm: ResendIntegrationForm,
};
