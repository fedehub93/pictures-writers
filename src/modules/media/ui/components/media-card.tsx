"use client";

import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  FileText,
  FolderInput,
  MoreVertical,
  Pencil,
  Trash,
  Upload,
} from "lucide-react";
import { MediaType } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { formatBytes } from "@/lib/format";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";

import { mediaErrorMessage } from "../../lib/error-message";
import { mediaDeletionCleanupNotice } from "../../lib/deletion-notice";
import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import { type MediaLibraryItem } from "../../lib/media-library";

interface MediaCardProps {
  media: MediaLibraryItem;
  checked: boolean;
  selected: boolean;
  /** When false, the card is not selectable and renders no checkbox. */
  selectable?: boolean;
  /** When false, the card does not ring or react to clicks for selection. */
  allowsSelection?: boolean;
  /** Whether the Archived badge may be shown. Always false for active rows. */
  showArchivedBadge?: boolean;
  onCheckboxChange: (id: string, isChecked: boolean) => void;
  /** Shows this Media in the details panel; the library owns the selection. */
  onSelect: (id: string) => void;
  /** Opens the folder picker for this Media; the library owns the move. */
  onMove: (id: string) => void;
}

export const MediaCard = ({
  media,
  checked,
  selected,
  selectable = true,
  allowsSelection = true,
  showArchivedBadge = false,
  onCheckboxChange,
  onSelect,
  onMove,
}: MediaCardProps) => {
  const { onOpen } = useModal();

  const trpc = useTRPC();
  const { invalidateLibrary } = useMediaInvalidation();

  const archive = useMutation(trpc.media.archive.mutationOptions());
  const restore = useMutation(trpc.media.restore.mutationOptions());
  const remove = useMutation(trpc.media.removeMany.mutationOptions());
  const isLoading = archive.isPending || restore.isPending || remove.isPending;

  const [confirmAction, setConfirmAction] = useState<
    | { type: "archive"; description: string; onConfirm: () => void }
    | { type: "delete"; description: string; onConfirm: () => void }
    | null
  >(null);

  const { id, name, altText, url, type, size, mimeType, archivedAt } = media;
  const isArchived = archivedAt !== null;

  const handleCheckboxChange = (next: boolean) => {
    onCheckboxChange(id, next);
  };

  const onHandleEdit = () => {
    onOpen("editMediaAsset", undefined, { id, name, altText: altText || "" });
  };

  const onHandleReplace = () => {
    onOpen("replaceMediaAsset", undefined, { id, name, type });
  };

  const runAction = async <T,>(
    action: () => Promise<T>,
    announce: (result: T) => void,
  ) => {
    try {
      announce(await action());
      await invalidateLibrary();
    } catch (error) {
      toast.error(mediaErrorMessage(error));
    }
  };

  const onArchive = () =>
    runAction(
      () => archive.mutateAsync({ ids: [id] }),
      () => toast.success("Media archived"),
    );

  const onRestore = () =>
    runAction(
      () => restore.mutateAsync({ ids: [id] }),
      () => toast.success("Media restored"),
    );

  const onDelete = () =>
    runAction(
      () => remove.mutateAsync({ ids: [id] }),
      ({ cleanup }) => {
        toast.success("Media deleted permanently");

        const notice = mediaDeletionCleanupNotice(cleanup);
        if (notice) toast(notice);
      },
    );

  const archiveDescription =
    "Archived Media leave the library but keep being served and referenced. You can restore them later.";
  const deleteDescription =
    "This permanently removes the file and every generated rendition. It cannot be undone, and it is refused while content still uses this Media.";

  return (
    <div
      data-media-id={id}
      data-selected={selected || undefined}
      onClick={() => allowsSelection && onSelect(id)}
      className={`relative group overflow-hidden border rounded-lg h-full transition ${
        allowsSelection ? "cursor-pointer hover:shadow-2xs" : ""
      } ${selected ? "ring-2 ring-ring border-transparent" : ""}`}
    >
      {/* The overlay is a second surface: using it must not change which item
          the details panel is describing. */}
      <div
        className="absolute p-2 z-10 w-full flex items-start justify-between gap-x-2"
        onClick={(event) => event.stopPropagation()}
      >
        {selectable ? (
          <Checkbox
            checked={checked}
            onCheckedChange={handleCheckboxChange}
            aria-label={`Select ${name}`}
            className="bg-background/80 backdrop-blur-sm"
          />
        ) : (
          <span />
        )}
        <MediaCardMenu
          name={name}
          isArchived={isArchived}
          isLoading={isLoading}
          archiveDescription={archiveDescription}
          deleteDescription={deleteDescription}
          onEdit={onHandleEdit}
          onReplace={onHandleReplace}
          onMove={() => onMove(id)}
          onArchive={onArchive}
          onRestore={onRestore}
          onDelete={onDelete}
          onConfirm={setConfirmAction}
        />
      </div>
      <div className="relative w-full aspect-video rounded-md overflow-hidden">
        {type === MediaType.IMAGE && (
          <Image
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            alt={altText || name}
            src={url}
          />
        )}
        {type === MediaType.VIDEO && (
          <video
            controls
            preload="metadata"
            src={url}
            className="absolute inset-0 w-full h-full object-cover bg-black"
          />
        )}
        {type === MediaType.AUDIO && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted px-3">
            <audio controls preload="metadata" src={url} className="w-full" />
          </div>
        )}
        {type === MediaType.FILE && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
            <FileText className="size-10" strokeWidth={1} />
            <span className="text-xs font-medium uppercase">
              {mimeType?.split("/").pop()?.split(";")[0] || "document"}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-y-2 p-3">
        <div className="flex justify-between items-center gap-x-4">
          {allowsSelection ? (
            <button
              type="button"
              aria-label={`View details for ${name}`}
              onClick={(event) => {
                // The root selects on any click; this control is the keyboard
                // path, so it must not select twice.
                event.stopPropagation();
                onSelect(id);
              }}
              className="min-w-0 truncate text-left text-sm font-medium transition group-hover:text-sky-700 focus-visible:underline focus-visible:outline-hidden"
            >
              {name}
            </button>
          ) : (
            <span className="min-w-0 truncate text-sm font-medium">{name}</span>
          )}
          {showArchivedBadge && isArchived && (
            <Badge variant="secondary">Archived</Badge>
          )}
        </div>
        {confirmAction && (
          <AlertDialog
            open
            onOpenChange={(open) => {
              if (!open) setConfirmAction(null);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {confirmAction.type === "archive"
                    ? "Archive this Media?"
                    : "Delete this Media permanently?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {confirmAction.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isLoading}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={isLoading}
                  onClick={() => confirmAction.onConfirm()}
                  className={
                    confirmAction.type === "delete"
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : undefined
                  }
                >
                  {confirmAction.type === "archive"
                    ? "Archive"
                    : "Delete permanently"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <p className="text-xs text-muted-foreground">
          {formatBytes(size || 0)}
        </p>
      </div>
    </div>
  );
};

function MediaCardMenu({
  name,
  isArchived,
  isLoading,
  archiveDescription,
  deleteDescription,
  onEdit,
  onReplace,
  onMove,
  onArchive,
  onRestore,
  onDelete,
  onConfirm,
}: {
  name: string;
  isArchived: boolean;
  isLoading: boolean;
  archiveDescription: string;
  deleteDescription: string;
  onEdit: () => void;
  onReplace: () => void;
  onMove: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
  onConfirm: (
    action:
      | { type: "archive"; description: string; onConfirm: () => void }
      | { type: "delete"; description: string; onConfirm: () => void },
  ) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`More actions for ${name}`}
          disabled={isLoading}
          className="bg-background/80 backdrop-blur-sm hover:bg-background"
        >
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isArchived ? (
          <>
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onReplace}>
              <Upload />
              Replace
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onMove}>
              <FolderInput />
              Move to folder
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isLoading}
              onSelect={() =>
                onConfirm({
                  type: "archive",
                  description: archiveDescription,
                  onConfirm: onArchive,
                })
              }
            >
              <Archive />
              Archive
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem onSelect={onRestore} disabled={isLoading}>
              <ArchiveRestore />
              Restore
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={isLoading}
              className="text-destructive focus:text-destructive"
              onSelect={() =>
                onConfirm({
                  type: "delete",
                  description: deleteDescription,
                  onConfirm: onDelete,
                })
              }
            >
              <Trash />
              Delete permanently
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
