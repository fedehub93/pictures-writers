"use client";

import { useState } from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  MoreVerticalIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";
import { toast } from "sonner";

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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { cn } from "@/shared/lib/utils";

import {
  useCreateContactFromConversation,
  useRemoveConversation,
  useSetConversationArchived,
} from "../../hooks/use-conversation-actions";
import { type ConversationGetOne } from "../../types";

interface ConversationActionsProps {
  conversation: ConversationGetOne;
  onDeleted?: (id: string) => void;
}

export const ConversationActions = ({
  conversation,
  onDeleted,
}: ConversationActionsProps) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const setArchived = useSetConversationArchived(conversation.emailAccountId);
  const remove = useRemoveConversation(conversation.emailAccountId);
  const createContact = useCreateContactFromConversation();

  const isArchived = Boolean(conversation.archivedAt);

  const handleArchiveToggle = () => {
    setArchived.mutate(
      { id: conversation.id, archived: !isArchived },
      {
        onSuccess: () =>
          toast.success(
            isArchived ? "Conversation unarchived" : "Conversation archived",
          ),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleDelete = () => {
    remove.mutate(
      { id: conversation.id },
      {
        onSuccess: () => {
          toast.success("Conversation deleted");
          setConfirmOpen(false);
          onDeleted?.(conversation.id);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  const handleCreateContact = () => {
    createContact.mutate(
      { id: conversation.id },
      {
        onSuccess: () => toast.success("Contact created"),
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Conversation actions"
          >
            <MoreVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!conversation.contactId && (
            <DropdownMenuItem
              disabled={createContact.isPending}
              onSelect={handleCreateContact}
            >
              <UserPlusIcon />
              Create contact
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={setArchived.isPending}
            onSelect={handleArchiveToggle}
          >
            {isArchived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
            {isArchived ? "Unarchive" : "Archive"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setConfirmOpen(true)}
          >
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              The conversation is moved to the trash. It is kept for history and
              can be permanently removed later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={remove.isPending}
              className={cn(
                "bg-destructive text-white hover:bg-destructive/90",
              )}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
