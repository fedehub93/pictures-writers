import "server-only";

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

interface WindowState {
  count: number;
  resetAt: number;
}

const windows = new Map<string, WindowState>();

/**
 * Simple in-memory sliding-window rate limit keyed by provider.
 *
 * This is intentionally small: it limits abuse of the connection-test endpoint
 * without introducing an external store. The map is shared per process, so a
 * restart clears all windows.
 */
export function checkIntegrationTestRateLimit(
  provider: string,
  options: RateLimitOptions = { maxRequests: 5, windowMs: 60_000 },
): RateLimitResult {
  const now = Date.now();
  const windowState = windows.get(provider);

  if (!windowState || now >= windowState.resetAt) {
    windows.set(provider, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true };
  }

  if (windowState.count >= options.maxRequests) {
    return { allowed: false, retryAfterMs: windowState.resetAt - now };
  }

  windowState.count += 1;
  return { allowed: true };
}

/**
 * Reset the rate-limit window for a provider. Intended for tests.
 */
export function resetIntegrationTestRateLimit(provider: string): void {
  windows.delete(provider);
}
