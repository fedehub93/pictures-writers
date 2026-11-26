"use client";

import { createContext, useContext, useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { mediaErrorMessage } from "@/modules/media/lib/error-message";
import { useMediaInvalidation } from "@/modules/media/hooks/use-media-invalidation";
import type { MediaFolderNode } from "@/modules/media/lib/media-folder";

import { MediaFolderNameDialog } from "./media-folder-name-dialog";

type DialogState =
  | { mode: "create"; parentId: string | null; onCreated?: () => void }
  | { mode: "rename"; folder: MediaFolderNode }
  | null;

interface MediaFolderDialogContextValue {
  /**
   * Open the create-folder dialog targeting a parent, or the My Drive root.
   * The optional callback runs only after the folder is successfully created.
   */
  openCreate: (
    parentId: string | null,
    onCreated?: () => void,
  ) => void;
  /** Open the rename-folder dialog for one tree node. */
  openRename: (folder: MediaFolderNode) => void;
  /** Close any open folder dialog. */
  close: () => void;
}

const MediaFolderDialogContext =
  createContext<MediaFolderDialogContextValue | null>(null);

export const useMediaFolderDialog = () => {
  const context = useContext(MediaFolderDialogContext);
  if (!context) {
    throw new Error(
      "useMediaFolderDialog must be used inside MediaFolderDialogProvider",
    );
  }
  return context;
};

/**
 * Owns the create and rename folder dialogs so both the header's "New Folder"
 * action and the tree's "New subfolder" / "Rename" actions can open the same
 * surface. The delete confirmation stays in the tree because only the tree
 * triggers it.
 */
export const MediaFolderDialogProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const trpc = useTRPC();
  const { invalidateFolders, invalidateLibrary } = useMediaInvalidation();

  const create = useMutation(trpc.media.createFolder.mutationOptions());
  const update = useMutation(trpc.media.updateFolder.mutationOptions());

  const [dialog, setDialog] = useState<DialogState>(null);
  const isSubmitting = create.isPending || update.isPending;

  const run = async (action: () => Promise<unknown>, message: string) => {
    try {
      await action();
      // The grid draws the child folders too, so a folder write refreshes both
      // reads: the tree and the folder cards, which getMany owns.
      await Promise.all([invalidateFolders(), invalidateLibrary()]);
      setDialog(null);
      toast.success(message);
    } catch (error) {
      toast.error(mediaErrorMessage(error));
    }
  };

  const onSubmitName = (name: string) => {
    if (!dialog) return;

    if (dialog.mode === "create") {
      const { parentId, onCreated } = dialog;

      void run(async () => {
        await create.mutateAsync({ name, parentId });
        onCreated?.();
      }, "Folder created");
      return;
    }

    void run(
      () => update.mutateAsync({ id: dialog.folder.id, name }),
      "Folder renamed",
    );
  };

  return (
    <MediaFolderDialogContext.Provider
      value={{
        openCreate: (parentId, onCreated) =>
          setDialog({ mode: "create", parentId, onCreated }),
        openRename: (folder) => setDialog({ mode: "rename", folder }),
        close: () => setDialog(null),
      }}
    >
      {children}
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
    </MediaFolderDialogContext.Provider>
  );
};
