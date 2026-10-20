"use client";

import { useState } from "react";
import {
  MoreHorizontalIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { type ConversationListItem } from "../../types";

/** Confirmation copy names the thread so a destructive mistake is avoidable. */
export function deleteForeverTitle(displayName: string): string {
  return `Permanently delete conversation with ${displayName}?`;
}

interface ConversationTrashMenuItemsProps {
  onRestore: () => void;
  onDeleteForever: () => void;
}

export const ConversationTrashMenuItems = ({
  onRestore,
  onDeleteForever,
}: ConversationTrashMenuItemsProps) => {
  return (
    <>
      <DropdownMenuItem onSelect={onRestore}>
        <RotateCcwIcon />
        Restore
      </DropdownMenuItem>
      <DropdownMenuItem
        onSelect={onDeleteForever}
        className="text-destructive focus:text-destructive"
      >
        <Trash2Icon />
        Delete forever
      </DropdownMenuItem>
    </>
  );
};

interface ConversationTrashMenuProps {
  conversation: ConversationListItem;
  onRestore: () => void;
  onDeleteForever: () => void;
}

/**
 * Trash rows only offer restore and permanent deletion. Read, star and archive
 * no longer make sense once a conversation is in the Trash view.
 */
export const ConversationTrashMenu = ({
  conversation,
  onRestore,
  onDeleteForever,
}: ConversationTrashMenuProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const displayName = conversation.contactName ?? conversation.contactEmail;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Trash actions"
            title="Trash actions"
          >
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <ConversationTrashMenuItems
            onRestore={onRestore}
            onDeleteForever={() => setConfirmOpen(true)}
          />
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{deleteForeverTitle(displayName)}</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the conversation, its messages and its
              attachments. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteForever}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
