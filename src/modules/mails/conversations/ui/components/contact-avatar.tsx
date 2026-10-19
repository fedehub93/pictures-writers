"use client";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

import { initials } from "../../lib/format";

const AVATAR_PALETTE = [
  "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300",
  "bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
];

function paletteFor(value: string): string {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash + value.charCodeAt(index)) % AVATAR_PALETTE.length;
  }
  return AVATAR_PALETTE[hash] ?? AVATAR_PALETTE[0]!;
}

interface ContactAvatarProps {
  name: string;
  className?: string;
}

export const ContactAvatar = ({ name, className }: ContactAvatarProps) => {
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarFallback
        className={cn("text-xs font-medium", paletteFor(name))}
      >
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
};
