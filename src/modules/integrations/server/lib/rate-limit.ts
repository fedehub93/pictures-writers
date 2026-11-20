import "server-only";

import {
  createFixedWindowLimiter,
  type RateLimitOptions,
  type RateLimitResult,
} from "@/shared/lib/fixed-window-rate-limit";

export type { RateLimitOptions, RateLimitResult };

const limiter = createFixedWindowLimiter();

/**
 * Limits abuse of the connection-test endpoint without introducing an external
 * store. The window is keyed by provider, so one provider under test cannot
 * exhaust another.
 */
export function checkIntegrationTestRateLimit(
  provider: string,
  options: RateLimitOptions = { maxRequests: 5, windowMs: 60_000 },
): RateLimitResult {
  return limiter.check(provider, options);
}

/**
 * Reset the rate-limit window for a provider. Intended for tests.
 */
export function resetIntegrationTestRateLimit(provider: string): void {
  limiter.clear(provider);
}
