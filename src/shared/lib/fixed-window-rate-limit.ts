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

/**
 * A small in-memory fixed-window limiter. It introduces no external store: a
 * restart clears every window, which is acceptable for the abuse limits that
 * use it. Keys are supplied by the caller, so each call site decides whether a
 * client, a provider or a form owns one.
 */
export function createFixedWindowLimiter({
  maxWindows = 10_000,
}: {
  maxWindows?: number;
} = {}) {
  const windows = new Map<string, WindowState>();

  function prune(now: number): void {
    for (const [key, state] of windows) {
      if (now >= state.resetAt) windows.delete(key);
    }

    // A flood of invented keys must not disable the limit installation-wide:
    // evict the window that expires first, once per new key.
    if (windows.size >= maxWindows) {
      let oldestKey: string | null = null;
      let oldestResetAt = Number.POSITIVE_INFINITY;

      for (const [key, state] of windows) {
        if (state.resetAt < oldestResetAt) {
          oldestResetAt = state.resetAt;
          oldestKey = key;
        }
      }

      if (oldestKey !== null) windows.delete(oldestKey);
    }
  }

  return {
    check(key: string, options: RateLimitOptions): RateLimitResult {
      const now = Date.now();
      const state = windows.get(key);

      if (!state || now >= state.resetAt) {
        prune(now);
        windows.set(key, { count: 1, resetAt: now + options.windowMs });
        return { allowed: true };
      }

      if (state.count >= options.maxRequests) {
        return { allowed: false, retryAfterMs: state.resetAt - now };
      }

      state.count += 1;
      return { allowed: true };
    },

    /** Drops one key, or every window when called without one. */
    clear(key?: string): void {
      if (key === undefined) {
        windows.clear();
        return;
      }

      windows.delete(key);
    },
  };
}
