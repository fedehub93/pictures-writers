import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import type { IntegrationProvider } from "./constants";
import type { IntegrationSecrets } from "./types";

/**
 * Per-request cache for resolved integration data.
 *
 * The cache is scoped to a single request/execution by AsyncLocalStorage.
 * Callers must wrap the work that should share the cache with
 * `withIntegrationResolutionCache`. The resolution functions in `resolution.ts`
 * and `public-config.ts` read from and write to these caches automatically.
 */

type PublicConfig = Record<string, unknown> | null;

const resolutionCache = new AsyncLocalStorage<
  Map<IntegrationProvider, IntegrationSecrets<IntegrationProvider>>
>();

const publicConfigCache = new AsyncLocalStorage<
  Map<IntegrationProvider, PublicConfig>
>();

export function withIntegrationResolutionCache<T>(fn: () => T): T {
  return resolutionCache.run(new Map(), () =>
    publicConfigCache.run(new Map(), fn),
  );
}

export function getCachedIntegrationSecrets<P extends IntegrationProvider>(
  provider: P,
): IntegrationSecrets<P> | undefined {
  return resolutionCache.getStore()?.get(provider) as
    | IntegrationSecrets<P>
    | undefined;
}

export function setCachedIntegrationSecrets<P extends IntegrationProvider>(
  provider: P,
  secrets: IntegrationSecrets<P>,
): void {
  resolutionCache.getStore()?.set(provider, secrets);
}

/**
 * Returns `undefined` on a cache miss and `null` for a cached "no config"
 * result, so callers can distinguish the two.
 */
export function getCachedIntegrationPublicConfig(
  provider: IntegrationProvider,
): PublicConfig | undefined {
  const store = publicConfigCache.getStore();
  if (!store?.has(provider)) {
    return undefined;
  }
  return store.get(provider) ?? null;
}

export function setCachedIntegrationPublicConfig(
  provider: IntegrationProvider,
  config: PublicConfig,
): void {
  publicConfigCache.getStore()?.set(provider, config);
}
