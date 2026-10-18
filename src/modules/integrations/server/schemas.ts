import * as z from "zod";

export const integrationProviderParamSchema = z.object({
  provider: z.string(),
});

export const integrationSecretsUpdateSchema = z.object({
  apiKey: z.string().nullish(),
  webhookSecret: z.string().nullish(),
});

export const integrationUpdateSchema = z.object({
  provider: z.string(),
  isEnabled: z.boolean().optional(),
  secrets: integrationSecretsUpdateSchema.optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const integrationSetEnabledSchema = z.object({
  provider: z.string(),
  isEnabled: z.boolean(),
});

export type IntegrationUpdateValues = z.infer<typeof integrationUpdateSchema>;
export type IntegrationSetEnabledValues = z.infer<
  typeof integrationSetEnabledSchema
>;
export type IntegrationSecretsUpdateValues = z.infer<
  typeof integrationSecretsUpdateSchema
>;
