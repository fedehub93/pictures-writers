"use client";

import { StarIcon } from "lucide-react";

import { cn } from "@/shared/lib/utils";

/** Filled star shown wherever a conversation is part of the Starred view. */
export const StarBadge = ({ className }: { className?: string }) => {
  return (
    <StarIcon
      role="img"
      aria-label="Starred"
      className={cn(
        "shrink-0 fill-amber-400 text-amber-500",
        className,
      )}
    />
  );
};
