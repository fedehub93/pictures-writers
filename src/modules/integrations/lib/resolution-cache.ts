import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";

import type { IntegrationProvider } from "./constants";
import type { IntegrationSecrets } from "./types";

/**
 * Per-request cache for decrypted integration secrets.
 *
 * The cache is scoped to a single request/execution by AsyncLocalStorage.
 * Callers must wrap the work that should share the cache with
 * `withIntegrationResolutionCache`. The resolution function in `resolution.ts`
 * reads from and writes to this cache automatically.
 */

const resolutionCache = new AsyncLocalStorage<
  Map<IntegrationProvider, IntegrationSecrets<IntegrationProvider>>
>();

export function withIntegrationResolutionCache<T>(fn: () => T): T {
  return resolutionCache.run(new Map(), fn);
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

export function invalidateCachedIntegrationSecrets(
  provider: IntegrationProvider,
): void {
  resolutionCache.getStore()?.delete(provider);
}
