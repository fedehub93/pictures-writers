import "server-only";

import { db } from "@/shared/lib/db";

import { decryptCredentialSecret } from "../credentials/lib/credential-store";
import type { AutomationEffect } from "../lib/effects";
import type { JsonObject, JsonValue } from "../lib/graph";
import {
  buildHttpProviderRequest,
  buildLlmProviderRequest,
  buildWebSearchProviderRequest,
  extractLlmText,
  extractWebSearchResults,
  MissingActionConfigError,
  type HttpRequestConfig,
  type LlmConfig,
  type ProviderHttpRequest,
  type WebSearchConfig,
} from "../lib/actions";
import {
  AutomationNodeError,
  TransientAutomationNodeError,
} from "../lib/node-registry";

/**
 * App-level provider effects for the general-purpose actions. The engine emits
 * a generic request (`config` + `credentialId`); these effects resolve the
 * Credential secret at the execution boundary and shape the real provider call.
 * A `transport` seam lets tests assert the outbound request with no network.
 */
export type ActionTransport = (
  request: ProviderHttpRequest,
) => Promise<JsonValue>;

/**
 * Resolves a Credential id to its plaintext secret. The default reads the
 * encrypted row from the database; tests inject a recorder.
 */
export type CredentialSecretResolver = (
  credentialId: string,
) => Promise<string | null>;

export interface ActionEffectOptions {
  transport?: ActionTransport;
  resolveCredentialSecret?: CredentialSecretResolver;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseEffectRequest(request: JsonValue): {
  config: JsonObject;
  credentialId: string | null;
} {
  const record = isRecord(request) ? request : {};
  const config = isRecord(record.config) ? (record.config as JsonObject) : {};
  const credentialId =
    typeof record.credentialId === "string" && record.credentialId.trim().length > 0
      ? record.credentialId
      : null;

  return { config, credentialId };
}

async function defaultResolveCredentialSecret(
  credentialId: string,
): Promise<string | null> {
  const credential = await db.credential.findUnique({
    where: { id: credentialId },
  });

  if (!credential) {
    throw new AutomationNodeError(
      `Credential ${credentialId} not found`,
      false,
    );
  }

  return decryptCredentialSecret(credential.secretEncrypted);
}

async function defaultFetchTransport(
  request: ProviderHttpRequest,
): Promise<JsonValue> {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
    body:
      request.body === undefined
        ? undefined
        : typeof request.body === "string"
          ? request.body
          : JSON.stringify(request.body),
  });

  const text = await response.text();
  let parsed: JsonValue = text;

  if (text.length > 0) {
    try {
      parsed = JSON.parse(text) as JsonValue;
    } catch {
      parsed = text;
    }
  } else {
    parsed = null;
  }

  if (!response.ok) {
    const message = `HTTP ${response.status} from ${request.url}`;
    if (response.status === 429 || response.status >= 500) {
      throw new TransientAutomationNodeError(message);
    }
    throw new AutomationNodeError(message, false);
  }

  return parsed;
}

function toNodeError(error: unknown): never {
  if (error instanceof MissingActionConfigError) {
    throw new AutomationNodeError(error.message, false);
  }

  throw error;
}

function resolveOptions(options: ActionEffectOptions) {
  return {
    transport: options.transport ?? defaultFetchTransport,
    resolveCredentialSecret:
      options.resolveCredentialSecret ?? defaultResolveCredentialSecret,
  };
}

type ActionRunner = (
  config: JsonObject,
  secret: string | undefined,
  transport: ActionTransport,
) => Promise<JsonValue>;

/**
 * Wraps an action runner with the shared execution boundary: parse the effect
 * request, resolve the Credential secret, run the provider call and classify
 * configuration errors as permanent node failures.
 */
function createActionEffect(
  run: ActionRunner,
  options: ActionEffectOptions,
): AutomationEffect {
  const { transport, resolveCredentialSecret } = resolveOptions(options);

  return async (request) => {
    const { config, credentialId } = parseEffectRequest(request);
    const secret = credentialId
      ? await resolveCredentialSecret(credentialId)
      : null;

    try {
      return await run(config, secret ?? undefined, transport);
    } catch (error) {
      return toNodeError(error);
    }
  };
}

/** HTTP Request: performs the shaped call and returns the parsed response. */
export function createAutomationHttpEffect(
  options: ActionEffectOptions = {},
): AutomationEffect {
  return createActionEffect(
    (config, secret, transport) =>
      transport(
        buildHttpProviderRequest(config as unknown as HttpRequestConfig, secret),
      ),
    options,
  );
}

/** Web Search: runs the query against the provider and returns its results. */
export function createAutomationWebSearchEffect(
  options: ActionEffectOptions = {},
): AutomationEffect {
  return createActionEffect(async (config, secret, transport) => {
    const webSearch = config as unknown as WebSearchConfig;
    const response = await transport(
      buildWebSearchProviderRequest(webSearch, secret),
    );

    return extractWebSearchResults(webSearch.provider, response);
  }, options);
}

/** LLM: runs the prompt against the provider and returns the assistant text. */
export function createAutomationLlmEffect(
  options: ActionEffectOptions = {},
): AutomationEffect {
  return createActionEffect(async (config, secret, transport) => {
    const llm = config as unknown as LlmConfig;
    const response = await transport(buildLlmProviderRequest(llm, secret));
    const text = extractLlmText(response);

    if (text === null) {
      throw new AutomationNodeError(
        "LLM provider returned no text",
        false,
      );
    }

    return text;
  }, options);
}
