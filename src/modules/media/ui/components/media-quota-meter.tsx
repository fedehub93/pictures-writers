"use client";

import { formatBytes } from "@/lib/format";
import {
  MEDIA_QUOTA_WARNING_RATIO,
  type MediaQuotaStatus,
} from "../../lib/quota";

const BAR_COLOR: Record<MediaQuotaStatus["level"], string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  exceeded: "bg-rose-500",
};

/**
 * One number describes the disk: every stored file counts, whatever its role,
 * and the public-origin share is named against the reserve that bounds it.
 */
export const MediaQuotaMeter = ({ quota }: { quota: MediaQuotaStatus }) => {
  const publicReserveFull = quota.publicBytes >= quota.reserveBytes;

  return (
    <div className="flex min-w-64 max-w-96 flex-col gap-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Storage</span>
        <span>
          {formatBytes(quota.usedBytes)} of {formatBytes(quota.totalBytes)} (
          {quota.percent}%)
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Storage quota usage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={quota.percent}
      >
        <div
          className={`h-full ${BAR_COLOR[quota.level]}`}
          style={{ width: `${quota.percent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Public uploads: {formatBytes(quota.publicBytes)} of{" "}
        {formatBytes(quota.reserveBytes)} reserve
      </p>
      {publicReserveFull && (
        <p className="text-xs text-amber-600">
          Visitor uploads are refused: the public reserve is full. Raise it in
          Settings or delete public files.
        </p>
      )}
      {quota.level === "warning" && (
        <p className="text-xs text-amber-600">
          Storage is above {MEDIA_QUOTA_WARNING_RATIO * 100}% of its quota.
          Delete files permanently or raise the quota in Settings.
        </p>
      )}
      {quota.level === "exceeded" && (
        <p className="text-xs text-rose-600">
          Storage is over its quota. New uploads are refused until enough files
          are deleted or the quota is raised.
        </p>
      )}
    </div>
  );
};
