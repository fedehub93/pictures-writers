import type { JsonObject, JsonValue } from "../graph";
import type { AutomationInterpolationContext } from "../interpolate";
import {
  MissingActionConfigError,
  readTrimmedString,
  resolveActionConfig,
} from "./shared";

export const HTTP_REQUEST_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
  "HEAD",
  "OPTIONS",
] as const;

export interface HttpRequestConfig {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: JsonValue;
}

function resolveHeaders(source: JsonObject): Record<string, string> | undefined {
  let raw = source.headers;

  if (typeof raw === "string") {
    if (raw.trim().length === 0) {
      return undefined;
    }
    try {
      raw = JSON.parse(raw) as JsonValue;
    } catch {
      throw new MissingActionConfigError(
        "HTTP Request headers must be valid JSON",
      );
    }
  }

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return undefined;
  }

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw as JsonObject)) {
    if (value === null || value === undefined) {
      continue;
    }
    headers[key] = typeof value === "string" ? value : JSON.stringify(value);
  }

  return Object.keys(headers).length > 0 ? headers : undefined;
}

/**
 * Interpolates an HTTP Request node's configuration into a concrete call.
 * The method defaults to GET, the URL is required and must be a valid absolute
 * URL, and headers may be authored as an object or a JSON string.
 */
export function resolveHttpRequestConfig(
  data: JsonObject,
  context: AutomationInterpolationContext,
): HttpRequestConfig {
  const config = resolveActionConfig(data, context);

  const url = readTrimmedString(config, "url");
  if (!url) {
    throw new MissingActionConfigError("HTTP Request node is missing a URL");
  }

  try {
    new URL(url);
  } catch {
    throw new MissingActionConfigError(
      `HTTP Request node has an invalid URL: ${url}`,
    );
  }

  const method = (readTrimmedString(config, "method") ?? "GET").toUpperCase();
  if (!(HTTP_REQUEST_METHODS as readonly string[]).includes(method)) {
    throw new MissingActionConfigError(
      `HTTP Request node has an unsupported method: ${method}`,
    );
  }

  const headers = resolveHeaders(config);
  const hasBody =
    config.body !== undefined &&
    config.body !== null &&
    method !== "GET" &&
    method !== "HEAD";

  return {
    method,
    url,
    ...(headers ? { headers } : {}),
    ...(hasBody ? { body: config.body } : {}),
  };
}
