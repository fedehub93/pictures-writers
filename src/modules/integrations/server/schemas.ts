import * as z from "zod";

import {
  isIntegrationProvider,
  type IntegrationProvider,
} from "@/modules/integrations/lib";

const integrationProvider = z.custom<IntegrationProvider>(
  (value) => typeof value === "string" && isIntegrationProvider(value),
  { message: "Invalid integration provider" },
);

export const integrationProviderParamSchema = z.object({
  provider: integrationProvider,
});

export const integrationSecretsUpdateSchema = z.object({
  apiKey: z.string().nullish(),
  webhookSecret: z.string().nullish(),
});

export const integrationUpdateSchema = z.object({
  provider: integrationProvider,
  isEnabled: z.boolean().optional(),
  secrets: integrationSecretsUpdateSchema.optional(),
});

export const integrationSetEnabledSchema = z.object({
  provider: integrationProvider,
  isEnabled: z.boolean(),
});

export type IntegrationUpdateValues = z.infer<typeof integrationUpdateSchema>;
export type IntegrationSetEnabledValues = z.infer<
  typeof integrationSetEnabledSchema
>;
export type IntegrationSecretsUpdateValues = z.infer<
  typeof integrationSecretsUpdateSchema
>;
