"use client";

import type { DashboardAuthor } from "@/shared/dashboard/author";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/ui/tooltip";

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

/**
 * The compact author cell of a Dashboard list widget: just an avatar, with the
 * author's name revealed on hover so the row stays narrow.
 */
export const WidgetAuthorAvatar = ({
  author,
}: {
  author: DashboardAuthor | null;
}) => {
  if (!author) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">
            <Avatar className="size-6">
              <AvatarImage
                src={author.imageUrl ?? undefined}
                alt={author.name}
                className="object-cover"
              />
              <AvatarFallback className="text-[10px]">
                {initials(author.name)}
              </AvatarFallback>
            </Avatar>
          </span>
        </TooltipTrigger>
        <TooltipContent>{author.name}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
