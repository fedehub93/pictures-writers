import "server-only";

import { getSettings } from "@/data/settings";

import { DEFAULT_TIME_ZONE, normalizeTimeZone } from "../lib/time-zone";

/**
 * The IANA time zone the site schedules in, read from `Settings.timezone`.
 * Falls back to `UTC` when unset or unreadable so a broken setting can never
 * stall the pump.
 */
export async function getSiteTimeZone(): Promise<string> {
  try {
    const settings = await getSettings();
    return normalizeTimeZone(settings.timezone);
  } catch {
    return DEFAULT_TIME_ZONE;
  }
}
