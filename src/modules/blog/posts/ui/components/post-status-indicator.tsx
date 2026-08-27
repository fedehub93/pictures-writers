"use client";

import React from "react";
import {
  CheckIcon,
  CircleIcon,
  AlertCircleIcon,
  CircleCheckIcon,
} from "lucide-react";
import { BounceLoader, PuffLoader, SyncLoader } from "react-spinners";

import { type PostStatus, usePostStore } from "../../store/use-post-store";

const statusConfig: Record<
  PostStatus,
  { label: string; Icon: React.ReactNode }
> = {
  no_change: {
    label: "No change",
    Icon: <CircleIcon className="size-3 fill-current" />,
  },
  error: {
    label: "Error",
    Icon: <AlertCircleIcon className="size-4 fill-current" />,
  },
  edited: {
    label: "Edited",
    Icon: <AlertCircleIcon className="size-4 fill-current" />,
  },
  saving: {
    label: "Saving...",
    Icon: <PuffLoader size={10} color="var(--primary)" />,
  },
  saved: {
    label: "Saved",
    Icon: <CircleCheckIcon className="size-4 text-primary" />,
  },
  publishing: {
    label: "Publishing",
    Icon: <BounceLoader size={10} color="var(--primary)" />,
  },
  published: {
    label: "Published",
    Icon: <CircleCheckIcon className="size-4 text-primary" />,
  },
};

export function PostStatusIndicator() {
  const status = usePostStore((state) => state.status);
  const config = statusConfig[status];

  return (
    <div className="flex-1 flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
      {config.Icon}
      <span className="mt-0.5 font-semibold">{config.label}</span>
    </div>
  );
}
