"use client";

import { formatBytes } from "@/lib/format";
import {
  MEDIA_QUOTA_WARNING_RATIO,
  type MediaQuotaStatus,
} from "@/modules/media/lib/quota";

const BAR_COLOR: Record<MediaQuotaStatus["level"], string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  exceeded: "bg-rose-500",
};

export const MediaQuotaMeter = ({ quota }: { quota: MediaQuotaStatus }) => {
  return (
    <div className="flex min-w-64 max-w-96 flex-col gap-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Media quota</span>
        <span>
          {formatBytes(quota.usedBytes)} of {formatBytes(quota.totalBytes)} (
          {quota.percent}%)
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Media quota usage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={quota.percent}
      >
        <div
          className={`h-full ${BAR_COLOR[quota.level]}`}
          style={{ width: `${quota.percent}%` }}
        />
      </div>
      {quota.level === "warning" && (
        <p className="text-xs text-amber-600">
          The media library is above {MEDIA_QUOTA_WARNING_RATIO * 100}% of its
          quota. Delete media permanently or raise the quota in Settings.
        </p>
      )}
      {quota.level === "exceeded" && (
        <p className="text-xs text-rose-600">
          The media library is over its quota. New uploads are refused until
          enough media is deleted or the quota is raised.
        </p>
      )}
    </div>
  );
};
