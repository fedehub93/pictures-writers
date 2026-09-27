import type { JsonObject, JsonValue } from "../graph";
import type { HttpRequestConfig } from "./http-request";
import type { LlmConfig } from "./llm";
import { MissingActionConfigError } from "./shared";
import type { WebSearchConfig } from "./web-search";

/**
 * A provider-agnostic HTTP request. Effects hand this to a transport (real
 * `fetch` in production, an injectable recorder in tests), so provider details
 * never leak into the engine or the node handlers.
 */
export interface ProviderHttpRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: JsonValue;
}

function hasHeader(
  headers: Record<string, string>,
  name: string,
): boolean {
  const target = name.toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === target);
}

/**
 * Builds the outbound request for an HTTP Request node. When a Credential
 * secret is supplied it is attached as a bearer token unless the node's own
 * headers already set `Authorization`.
 */
export function buildHttpProviderRequest(
  config: HttpRequestConfig,
  secret?: string,
): ProviderHttpRequest {
  const headers = { ...(config.headers ?? {}) };

  if (secret && !hasHeader(headers, "authorization")) {
    headers.Authorization = `Bearer ${secret}`;
  }

  if (
    config.body !== undefined &&
    typeof config.body !== "string" &&
    !hasHeader(headers, "content-type")
  ) {
    headers["Content-Type"] = "application/json";
  }

  return {
    url: config.url,
    method: config.method,
    headers,
    ...(config.body !== undefined ? { body: config.body } : {}),
  };
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

function stringOrNull(value: unknown): JsonValue {
  return typeof value === "string" ? value : null;
}

/**
 * Builds the outbound request for a Web Search node against its provider. All
 * supported providers require a Credential.
 */
export function buildWebSearchProviderRequest(
  config: WebSearchConfig,
  secret?: string,
): ProviderHttpRequest {
  if (!secret) {
    throw new MissingActionConfigError(
      "Web Search node requires a credential with an API key",
    );
  }

  switch (config.provider) {
    case "tavily":
      return {
        url: "https://api.tavily.com/search",
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: {
          api_key: secret,
          query: config.query,
          ...(config.maxResults !== undefined
            ? { max_results: config.maxResults }
            : {}),
        },
      };
    case "brave": {
      const url = new URL("https://api.search.brave.com/res/v1/web/search");
      url.searchParams.set("q", config.query);
      if (config.maxResults !== undefined) {
        url.searchParams.set("count", String(config.maxResults));
      }
      return {
        url: url.toString(),
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Subscription-Token": secret,
        },
      };
    }
    case "serper":
      return {
        url: "https://google.serper.dev/search",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-KEY": secret,
        },
        body: {
          q: config.query,
          ...(config.maxResults !== undefined ? { num: config.maxResults } : {}),
        },
      };
    default:
      throw new MissingActionConfigError(
        `Unsupported web search provider: ${config.provider}`,
      );
  }
}

function asObject(value: JsonValue): JsonObject | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

/** Extracts the list of results from a provider's raw response. */
export function extractWebSearchResults(
  provider: string,
  response: JsonValue,
): JsonValue {
  const record = asObject(response);
  if (!record) {
    return [];
  }

  switch (provider) {
    case "tavily":
      return record.results ?? [];
    case "brave": {
      const web = asObject(record.web ?? null);
      return web?.results ?? [];
    }
    case "serper":
      return record.organic ?? [];
    default:
      return [];
  }
}

const DEFAULT_OPENAI_BASE_URL = "https://api.openai.com/v1";

/**
 * Builds the outbound request for an LLM node. Providers are OpenAI-compatible,
 * so a custom `baseUrl` targets any compatible gateway.
 */
export function buildLlmProviderRequest(
  config: LlmConfig,
  secret?: string,
): ProviderHttpRequest {
  if (!secret) {
    throw new MissingActionConfigError(
      "LLM node requires a credential with an API key",
    );
  }

  if (config.provider !== "openai") {
    throw new MissingActionConfigError(
      `Unsupported LLM provider: ${config.provider}`,
    );
  }

  const baseUrl = trimTrailingSlash(config.baseUrl ?? DEFAULT_OPENAI_BASE_URL);
  const messages: JsonValue[] = [];
  if (config.system) {
    messages.push({ role: "system", content: config.system });
  }
  messages.push({ role: "user", content: config.prompt });

  return {
    url: `${baseUrl}/chat/completions`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: {
      model: config.model,
      messages,
      ...(config.temperature !== undefined
        ? { temperature: config.temperature }
        : {}),
    },
  };
}

/** Extracts the assistant text from an OpenAI-compatible response. */
export function extractLlmText(response: JsonValue): JsonValue {
  const record = asObject(response);
  const choices = record?.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return null;
  }

  const choice = asObject(choices[0] as JsonValue);
  const message = asObject(choice?.message ?? null);
  return message?.content !== undefined
    ? stringOrNull(message.content)
    : null;
}
