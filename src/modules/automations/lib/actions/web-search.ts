import type { JsonObject } from "../graph";
import type { AutomationInterpolationContext } from "../interpolate";
import {
  MissingActionConfigError,
  readNumber,
  readTrimmedString,
  resolveActionConfig,
} from "./shared";

export const WEB_SEARCH_PROVIDERS = ["tavily", "brave", "serper"] as const;
export const DEFAULT_WEB_SEARCH_PROVIDER = "tavily";

export interface WebSearchConfig {
  provider: string;
  query: string;
  maxResults?: number;
}

/**
 * Interpolates a Web Search node's configuration into a concrete query. The
 * provider defaults to Tavily; the query is required. Authentication comes from
 * the referenced Credential, never from this config.
 */
export function resolveWebSearchConfig(
  data: JsonObject,
  context: AutomationInterpolationContext,
): WebSearchConfig {
  const config = resolveActionConfig(data, context);

  const query = readTrimmedString(config, "query");
  if (!query) {
    throw new MissingActionConfigError("Web Search node is missing a query");
  }

  const provider = (
    readTrimmedString(config, "provider") ?? DEFAULT_WEB_SEARCH_PROVIDER
  ).toLowerCase();
  if (!(WEB_SEARCH_PROVIDERS as readonly string[]).includes(provider)) {
    throw new MissingActionConfigError(
      `Web Search node has an unsupported provider: ${provider}`,
    );
  }

  const rawMaxResults = readNumber(config, "maxResults");
  const maxResults =
    rawMaxResults !== undefined && rawMaxResults > 0
      ? Math.floor(rawMaxResults)
      : undefined;

  return {
    provider,
    query,
    ...(maxResults !== undefined ? { maxResults } : {}),
  };
}
