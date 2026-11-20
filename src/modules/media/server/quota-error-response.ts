import { NextResponse } from "next/server";

import {
  MediaQuotaExceededError,
  PublicOriginReserveExceededError,
} from "./media-quota";

/**
 * The machine-readable answer for a refused upload. Both figures are kept so
 * an admin can tell a full disk from a full public reserve; the public refusal
 * also names the reserve that did it.
 */
export function quotaErrorResponse(error: unknown): NextResponse | null {
  const body = refusalBody(error);
  if (!body) return null;

  return NextResponse.json(body, { status: 413 });
}

function refusalBody(error: unknown): Record<string, unknown> | null {
  if (error instanceof MediaQuotaExceededError) {
    return {
      code: error.code,
      error: error.message,
      usedBytes: error.usedBytes,
      totalBytes: error.totalBytes,
      quotaMb: error.quotaMb,
    };
  }

  if (error instanceof PublicOriginReserveExceededError) {
    return {
      code: error.code,
      error: error.message,
      publicBytes: error.publicBytes,
      reserveBytes: error.reserveBytes,
      reserveMb: error.reserveMb,
    };
  }

  return null;
}
