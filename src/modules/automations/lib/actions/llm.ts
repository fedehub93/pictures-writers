import type { JsonObject } from "../graph";
import type { AutomationInterpolationContext } from "../interpolate";
import {
  MissingActionConfigError,
  readNumber,
  readTrimmedString,
  resolveActionConfig,
} from "./shared";

export const LLM_PROVIDERS = ["openai"] as const;
export const DEFAULT_LLM_PROVIDER = "openai";

export interface LlmConfig {
  provider: string;
  model: string;
  prompt: string;
  system?: string;
  temperature?: number;
  /** Overrides the provider base URL (OpenAI-compatible endpoints). */
  baseUrl?: string;
}

/**
 * Interpolates an LLM node's configuration into a concrete prompt. Provider and
 * model are required; authentication comes from the referenced Credential.
 */
export function resolveLlmConfig(
  data: JsonObject,
  context: AutomationInterpolationContext,
): LlmConfig {
  const config = resolveActionConfig(data, context);

  const prompt = readTrimmedString(config, "prompt");
  if (!prompt) {
    throw new MissingActionConfigError("LLM node is missing a prompt");
  }

  const model = readTrimmedString(config, "model");
  if (!model) {
    throw new MissingActionConfigError("LLM node is missing a model");
  }

  const provider = (
    readTrimmedString(config, "provider") ?? DEFAULT_LLM_PROVIDER
  ).toLowerCase();
  if (!(LLM_PROVIDERS as readonly string[]).includes(provider)) {
    throw new MissingActionConfigError(
      `LLM node has an unsupported provider: ${provider}`,
    );
  }

  const system = readTrimmedString(config, "system");
  const baseUrl = readTrimmedString(config, "baseUrl");
  const rawTemperature = readNumber(config, "temperature");
  const temperature =
    rawTemperature !== undefined && rawTemperature >= 0 && rawTemperature <= 2
      ? rawTemperature
      : undefined;

  return {
    provider,
    model,
    prompt,
    ...(system ? { system } : {}),
    ...(temperature !== undefined ? { temperature } : {}),
    ...(baseUrl ? { baseUrl } : {}),
  };
}
