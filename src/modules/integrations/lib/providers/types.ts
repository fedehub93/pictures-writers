import type { ComponentType } from "react";
import type * as z from "zod";

import type { IntegrationProvider } from "../constants";

export interface IntegrationProviderPresentation {
  name: string;
  description: string;
  Icon: ComponentType<{ className?: string }>;
}

/** One write-only secret a provider accepts, with its admin-facing label. */
export interface IntegrationSecretField {
  key: string;
  label: string;
  required: boolean;
}

/** Provider-agnostic read view of one secret: present, never its value. */
export interface IntegrationSecretPresence {
  key: string;
  label: string;
  required: boolean;
  present: boolean;
}

export interface IntegrationEnableContext {
  config: Record<string, unknown>;
  secretKeys: readonly string[];
}

export interface IntegrationProviderFormValues {
  config?: Record<string, unknown>;
  secrets?: Record<string, string | null | undefined>;
}

export interface IntegrationProviderFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerName: string;
  config: Record<string, unknown>;
  secrets: readonly IntegrationSecretPresence[];
  onSubmit: (values: IntegrationProviderFormValues) => void;
  isPending?: boolean;
}

export type IntegrationConfigSchema = z.ZodType<
  Record<string, unknown>,
  unknown
>;

export type IntegrationSecretsSchema = z.ZodType<
  Record<string, string | undefined>,
  Record<string, string | undefined>
>;

export interface IntegrationConnectionTestResult {
  success: boolean;
  error?: string;
}

export interface IntegrationConnectionTestContext {
  config: Record<string, unknown>;
  secrets: Record<string, string>;
}

export type IntegrationConnectionTest = (
  context: IntegrationConnectionTestContext,
) => Promise<IntegrationConnectionTestResult>;

/**
 * Everything code needs to know about one integration provider.
 *
 * A descriptor owns presentation, the schemas and rule that decide whether the
 * provider can be enabled, its optional connection test, whether enabling it
 * affects the public site, and the admin form that edits it. Adding a provider
 * is a descriptor plus a form; the generic integration CRUD does not change.
 */
export interface IntegrationProviderDescriptor {
  provider: IntegrationProvider;
  presentation: IntegrationProviderPresentation;
  configSchema: IntegrationConfigSchema;
  secretsSchema?: IntegrationSecretsSchema;
  secretFields: readonly IntegrationSecretField[];
  affectsPublicSite: boolean;
  /** Present only for providers that ship a connection test. */
  connectionTest?: IntegrationConnectionTest;
  isReady: (context: IntegrationEnableContext) => boolean;
  adminForm: ComponentType<IntegrationProviderFormProps>;
}
