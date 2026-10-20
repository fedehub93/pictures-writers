"use client";

import { MailIcon, MailOpenIcon, MoreHorizontalIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

/** Canonical label for the read toggle, shared by the row and detail menus. */
export function readActionLabel(isUnread: boolean): string {
  return isUnread ? "Mark as read" : "Mark as unread";
}

interface ConversationReadMenuItemsProps {
  isUnread: boolean;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
}

export const ConversationReadMenuItems = ({
  isUnread,
  onMarkRead,
  onMarkUnread,
}: ConversationReadMenuItemsProps) => {
  const Icon = isUnread ? MailOpenIcon : MailIcon;

  return (
    <DropdownMenuItem onSelect={isUnread ? onMarkRead : onMarkUnread}>
      <Icon />
      {readActionLabel(isUnread)}
    </DropdownMenuItem>
  );
};

interface ConversationReadMenuProps {
  isUnread: boolean;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
}

/** Kebab menu used on a conversation row and in the detail header. */
export const ConversationReadMenu = ({
  isUnread,
  onMarkRead,
  onMarkUnread,
}: ConversationReadMenuProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Conversation actions"
          title="More actions"
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <ConversationReadMenuItems
          isUnread={isUnread}
          onMarkRead={onMarkRead}
          onMarkUnread={onMarkUnread}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
