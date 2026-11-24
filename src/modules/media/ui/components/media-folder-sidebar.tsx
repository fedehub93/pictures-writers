"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { FolderPlus, HardDrive } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
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
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";

import { useMediaFolderTree } from "../../hooks/use-media";
import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import { mediaErrorMessage } from "../../lib/error-message";
import type { MediaFolderNode } from "../../lib/media-folder";

import { MediaFolderNameDialog } from "./media-folder-name-dialog";
import { MediaFolderTree } from "./media-folder-tree";

type DialogState =
  | { mode: "create"; parentId: string | null }
  | { mode: "rename"; folder: MediaFolderNode };

/**
 * The library's folder tree. It reads the nested tree the server built and
 * owns the three folder writes; the presentational tree only reports the row
 * an action named, so the same components render without a router in a test.
 */
export const MediaFolderSidebar = () => {
  const trpc = useTRPC();
  const { data, isPending, isError, refetch } = useMediaFolderTree();
  const { invalidateFolders } = useMediaInvalidation();

  const create = useMutation(trpc.media.createFolder.mutationOptions());
  const update = useMutation(trpc.media.updateFolder.mutationOptions());
  const remove = useMutation(trpc.media.deleteFolder.mutationOptions());

  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MediaFolderNode | null>(
    null,
  );
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const isSubmitting = create.isPending || update.isPending;
  const isDeleting = remove.isPending;

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      await invalidateFolders();
      setDialog(null);
      setDeleteTarget(null);
      toast.success(message);
    } catch (error) {
      toast.error(mediaErrorMessage(error));
    }
  };

  const onSubmitName = (name: string) => {
    if (!dialog) return;

    if (dialog.mode === "create") {
      const { parentId } = dialog;

      void run(async () => {
        await create.mutateAsync({ name, parentId });
        // The new branch must be visible where the action was taken; its own
        // row is already on screen, so only the parent has to open.
        if (parentId) {
          setExpandedIds((current) => new Set(current).add(parentId));
        }
      }, "Folder created");
      return;
    }

    void run(
      () => update.mutateAsync({ id: dialog.folder.id, name }),
      "Folder renamed",
    );
  };

  const onDelete = () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;

    void run(async () => {
      await remove.mutateAsync({ id });
      setExpandedIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
    }, "Folder deleted");
  };

  return (
    <aside
      aria-label="Media folders"
      className="w-56 shrink-0 border-r pr-4"
    >
      <div className="flex items-center justify-between gap-x-2">
        <div className="flex min-w-0 items-center gap-x-2 text-sm font-medium">
          <HardDrive className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate">My Drive</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label="New folder in My Drive"
          onClick={() => setDialog({ mode: "create", parentId: null })}
        >
          <FolderPlus />
        </Button>
      </div>

      <ScrollArea className="mt-2 max-h-[calc(100vh-18rem)]">
        {isPending && (
          <div className="flex flex-col gap-y-2 py-1">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-4/5" />
            <Skeleton className="h-6 w-3/5" />
          </div>
        )}

        {isError && (
          <div className="py-2 text-xs text-muted-foreground">
            The folders could not be loaded.{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void refetch()}
            >
              Retry
            </button>
          </div>
        )}

        {data &&
          (data.length > 0 ? (
            <MediaFolderTree
              nodes={data}
              expandedIds={expandedIds}
              onExpandedChange={setExpandedIds}
              onCreateChild={(folder) =>
                setDialog({ mode: "create", parentId: folder.id })
              }
              onRename={(folder) => setDialog({ mode: "rename", folder })}
              onDelete={setDeleteTarget}
            />
          ) : (
            <p className="py-2 text-xs text-muted-foreground">
              No folders yet. Create one to group related Media.
            </p>
          ))}
      </ScrollArea>

      {dialog && (
        <MediaFolderNameDialog
          // A fresh mount per target is what starts the form from the name it
          // was opened with; no effect has to reset it.
          key={
            dialog.mode === "create"
              ? `create-${dialog.parentId ?? "root"}`
              : `rename-${dialog.folder.id}`
          }
          open
          mode={dialog.mode}
          initialName={dialog.mode === "rename" ? dialog.folder.name : ""}
          isPending={isSubmitting}
          onOpenChange={(open) => {
            if (!open) setDialog(null);
          }}
          onSubmit={onSubmitName}
        />
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete “{deleteTarget?.name}”?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Only an empty folder can be deleted. Move its Media and remove its
              subfolders first; this refusal protects organized assets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={(event) => {
                event.preventDefault();
                onDelete();
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
};
