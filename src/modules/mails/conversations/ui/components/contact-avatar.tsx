"use client";

import { cn } from "@/shared/lib/utils";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";

import { initials } from "../../lib/format";

interface ContactAvatarProps {
  name: string;
  className?: string;
}

export const ContactAvatar = ({ name, className }: ContactAvatarProps) => {
  return (
    <Avatar className={cn("size-9", className)}>
      <AvatarFallback className="text-xs font-medium">
        {initials(name)}
      </AvatarFallback>
    </Avatar>
  );
};
