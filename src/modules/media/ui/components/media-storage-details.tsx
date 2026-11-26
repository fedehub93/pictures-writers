"use client";

import {
  FileText,
  Film,
  Image as ImageIcon,
  Music,
  type LucideIcon,
} from "lucide-react";

import { MediaType } from "@/generated/prisma";
import { formatBytes } from "@/lib/format";

import {
  type MediaQuotaStatus,
  type MediaStorageSnapshot,
} from "../../lib/quota";

const BAR_COLOR: Record<MediaQuotaStatus["level"], string> = {
  ok: "bg-emerald-500",
  warning: "bg-amber-500",
  exceeded: "bg-rose-500",
};

const TYPE_META: Record<
  MediaType,
  { label: string; icon: LucideIcon }
> = {
  [MediaType.IMAGE]: { label: "Images", icon: ImageIcon },
  [MediaType.VIDEO]: { label: "Videos", icon: Film },
  [MediaType.AUDIO]: { label: "Audio", icon: Music },
  [MediaType.FILE]: { label: "Documents", icon: FileText },
};

/**
 * How much of the Installation's one storage budget is used and how that splits
 * across Media types. The total is the quota figure the upload endpoints
 * enforce, so the bar and the refusal never disagree; the rows count stored
 * originals only, because a rendition shares its Media's bytes.
 */
export const MediaStorageDetails = ({
  quota,
  byMediaType,
}: MediaStorageSnapshot) => {
  const publicReserveFull = quota.publicBytes >= quota.reserveBytes;

  return (
    <section
      aria-label="Storage details"
      className="mt-3 border-t pt-3"
    >
      <div className="flex items-center justify-between gap-x-2 text-xs">
        <h2 className="font-medium">Storage</h2>
        <span className="text-muted-foreground">
          {formatBytes(quota.usedBytes)} of {formatBytes(quota.totalBytes)}
        </span>
      </div>

      <div
        className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted"
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
      <p className="mt-1 text-xs text-muted-foreground">{quota.percent}% used</p>

      <ul className="mt-2 flex flex-col gap-y-1">
        {byMediaType.map(({ type, count, bytes }) => {
          const { label, icon: Icon } = TYPE_META[type];

          return (
            <li
              key={type}
              className="flex items-center justify-between gap-x-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-x-1.5">
                <Icon
                  aria-hidden
                  className="size-3.5 shrink-0 text-muted-foreground"
                />
                <span className="truncate">{label}</span>
              </span>
              <span className="shrink-0 text-muted-foreground">
                {count} {count === 1 ? "file" : "files"} · {formatBytes(bytes)}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="mt-1 text-[11px] text-muted-foreground">
        Media originals only; renditions and attachments share the quota.
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
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
          Storage is above the warning threshold. Delete files permanently or
          raise the quota in Settings.
        </p>
      )}
      {quota.level === "exceeded" && (
        <p className="text-xs text-rose-600">
          Storage is over its quota. New uploads are refused until enough files
          are deleted or the quota is raised.
        </p>
      )}
    </section>
  );
};
