"use client";

import type { ReactNode } from "react";
import { AlertCircleIcon, CircleCheckIcon, CircleIcon } from "lucide-react";
import { BounceLoader, PuffLoader } from "react-spinners";

import { cn } from "@/shared/lib/utils";

/** The states a save indicator can present, shared by the dashboard and the
 * post editor so their "saving / saved" feedback is identical. */
export type SaveStatus =
  | "no_change"
  | "edited"
  | "saving"
  | "saved"
  | "publishing"
  | "published"
  | "error";

const STATUS_PRESENTATION: Record<
  SaveStatus,
  { label: string; icon: ReactNode }
> = {
  no_change: {
    label: "No change",
    icon: <CircleIcon className="size-3 fill-current" />,
  },
  error: {
    label: "Error",
    icon: <AlertCircleIcon className="size-4 fill-current" />,
  },
  edited: {
    label: "Edited",
    icon: <AlertCircleIcon className="size-4 fill-current" />,
  },
  saving: {
    label: "Saving...",
    icon: <PuffLoader size={10} color="var(--primary)" />,
  },
  saved: {
    label: "Saved",
    icon: <CircleCheckIcon className="size-4 text-primary" />,
  },
  publishing: {
    label: "Publishing",
    icon: <BounceLoader size={10} color="var(--primary)" />,
  },
  published: {
    label: "Published",
    icon: <CircleCheckIcon className="size-4 text-primary" />,
  },
};

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  className?: string;
}

/**
 * The shared save-state indicator: an icon and a label. Lives here so every
 * surface that auto-saves — the dashboard's layout, the post editor — shows the
 * same feedback.
 */
export const SaveStatusIndicator = ({
  status,
  className,
}: SaveStatusIndicatorProps) => {
  const { label, icon } = STATUS_PRESENTATION[status];

  return (
    <div
      aria-live="polite"
      className={cn(
        "flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300",
        className,
      )}
    >
      {icon}
      <span className="mt-0.5 font-semibold">{label}</span>
    </div>
  );
};
