import "server-only";

import { db } from "@/shared/lib/db";

import type { IntegrationProvider } from "./constants";
import { getIntegrationDescriptor } from "./providers";
import {
  getCachedIntegrationPublicConfig,
  setCachedIntegrationPublicConfig,
} from "./resolution-cache";
import type { IntegrationPublicConfig } from "./types";

type PublicConfigUnavailableReason =
  | "not_configured"
  | "disabled"
  | "incomplete"
  | "error";

/**
 * Only states that need someone to act are logged.
 *
 * A provider that was never configured, or that the operator disabled, is a
 * normal state for an optional integration: it emits nothing and stays silent.
 * An enabled row whose configuration does not validate, or a read failure, is
 * worth a line so the cause is visible without opening the backoffice.
 */
function needsAttention(reason: PublicConfigUnavailableReason): boolean {
  return reason === "incomplete" || reason === "error";
}

function logUnavailable(
  provider: IntegrationProvider,
  reason: PublicConfigUnavailableReason,
): void {
  console.warn(
    JSON.stringify({
      area: "integrations",
      event: "public_config_unavailable",
      provider,
      reason,
    }),
  );
}

function unavailable(
  provider: IntegrationProvider,
  reason: PublicConfigUnavailableReason,
): null {
  if (needsAttention(reason)) {
    logUnavailable(provider, reason);
  }

  setCachedIntegrationPublicConfig(provider, null);
  return null;
}

/**
 * Resolve a provider's non-secret configuration for public rendering.
 *
 * Fail-open by design: a missing row, a disabled row, an incomplete config and
 * an unexpected read error all return `null` instead of throwing. Public pages
 * must keep rendering when a third-party provider is not configured.
 *
 * Missing and disabled rows are normal states for an optional provider and are
 * not logged; incomplete configuration and read errors log one structured
 * `public_config_unavailable` line per request.
 *
 * Results (including `null`) are memoized per request when callers wrap the
 * work with `withIntegrationResolutionCache`.
 */
export async function resolveIntegrationPublicConfig<
  P extends IntegrationProvider,
>(provider: P): Promise<IntegrationPublicConfig<P> | null> {
  const cached = getCachedIntegrationPublicConfig(provider);
  if (cached !== undefined) {
    return cached as IntegrationPublicConfig<P> | null;
  }

  try {
    const row = await db.integration.findUnique({ where: { provider } });

    if (!row) {
      return unavailable(provider, "not_configured");
    }

    if (!row.isEnabled) {
      return unavailable(provider, "disabled");
    }

    const descriptor = getIntegrationDescriptor(provider);
    const parsed = descriptor.configSchema.safeParse(row.config ?? {});

    if (
      !parsed.success ||
      !descriptor.isReady({ config: parsed.data, secretKeys: [] })
    ) {
      return unavailable(provider, "incomplete");
    }

    setCachedIntegrationPublicConfig(provider, parsed.data);
    return parsed.data as IntegrationPublicConfig<P>;
  } catch {
    return unavailable(provider, "error");
  }
}
