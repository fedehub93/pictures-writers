"use client";

import {
  MailIcon,
  MailOpenIcon,
  MoreHorizontalIcon,
  StarIcon,
  StarOffIcon,
} from "lucide-react";

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

/** Star is the canonical term for the personal important filter. */
export function starActionLabel(isStarred: boolean): string {
  return isStarred ? "Unstar" : "Star";
}

interface ConversationReadMenuItemsProps {
  isUnread: boolean;
  isStarred: boolean;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  onToggleStar?: () => void;
}

export const ConversationReadMenuItems = ({
  isUnread,
  isStarred,
  onMarkRead,
  onMarkUnread,
  onToggleStar,
}: ConversationReadMenuItemsProps) => {
  const ReadIcon = isUnread ? MailOpenIcon : MailIcon;
  const StarToggleIcon = isStarred ? StarOffIcon : StarIcon;

  return (
    <>
      {onToggleStar && (
        <DropdownMenuItem onSelect={onToggleStar}>
          <StarToggleIcon />
          {starActionLabel(isStarred)}
        </DropdownMenuItem>
      )}
      <DropdownMenuItem onSelect={isUnread ? onMarkRead : onMarkUnread}>
        <ReadIcon />
        {readActionLabel(isUnread)}
      </DropdownMenuItem>
    </>
  );
};

interface ConversationReadMenuProps {
  isUnread: boolean;
  isStarred: boolean;
  onMarkRead?: () => void;
  onMarkUnread?: () => void;
  onToggleStar?: () => void;
}

/** Kebab menu used on a conversation row and in the detail header. */
export const ConversationReadMenu = ({
  isUnread,
  isStarred,
  onMarkRead,
  onMarkUnread,
  onToggleStar,
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
          isStarred={isStarred}
          onMarkRead={onMarkRead}
          onMarkUnread={onMarkUnread}
          onToggleStar={onToggleStar}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
