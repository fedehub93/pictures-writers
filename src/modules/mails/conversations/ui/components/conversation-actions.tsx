"use client";

import { useState } from "react";
import {
  ArchiveIcon,
  ArchiveRestoreIcon,
  ReplyIcon,
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
  useCreateContactFromConversation,
  useRemoveConversation,
  useSetConversationArchived,
} from "../../hooks/use-conversation-actions";
import { type ConversationGetOne } from "../../types";

interface ConversationActionsProps {
  conversation: ConversationGetOne;
  onReply?: () => void;
  onArchived?: () => void;
  onDeleted?: (id: string) => void;
}

export const ConversationActions = ({
  conversation,
  onReply,
  onArchived,
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
        onSuccess: () => {
          toast.success(
            isArchived ? "Conversation unarchived" : "Conversation archived",
          );
          // The thread leaves the current view, so close it.
          onArchived?.();
        },
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
      <div className="flex items-center gap-0.5">
        {onReply && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onReply}
            aria-label="Reply"
            title="Reply"
          >
            <ReplyIcon />
          </Button>
        )}

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleArchiveToggle}
          disabled={setArchived.isPending}
          aria-label={isArchived ? "Unarchive" : "Archive"}
          title={isArchived ? "Unarchive" : "Archive"}
        >
          {isArchived ? <ArchiveRestoreIcon /> : <ArchiveIcon />}
        </Button>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setConfirmOpen(true)}
          aria-label="Delete conversation"
          title="Delete"
        >
          <Trash2Icon />
        </Button>

        {!conversation.contactId && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleCreateContact}
            disabled={createContact.isPending}
            aria-label="Create contact"
            title="Create contact"
          >
            <UserPlusIcon />
          </Button>
        )}
      </div>

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
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
