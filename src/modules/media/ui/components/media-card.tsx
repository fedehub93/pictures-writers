"use client";

import Image from "next/image";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import {
  Archive,
  ArchiveRestore,
  FileText,
  FolderInput,
  MoreHorizontal,
  Trash,
} from "lucide-react";
import { MediaType } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { formatBytes } from "@/lib/format";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { mediaErrorMessage } from "../../lib/error-message";
import { mediaDeletionCleanupNotice } from "../../lib/deletion-notice";
import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import {
  formatMediaDimensions,
  type MediaLibraryEntry,
} from "../../lib/media-library";

import { MediaDetailRow } from "./media-detail-row";

interface MediaCardProps {
  media: MediaLibraryEntry;
  checked: boolean;
  selected: boolean;
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

  const {
    id,
    name,
    altText,
    url,
    type,
    size,
    mimeType,
    checksum,
    revision,
    archivedAt,
    usageCount,
  } = media;
  const dimensions = formatMediaDimensions(media);
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
    usageCount > 0
      ? `${usageCount} content ${
          usageCount === 1 ? "item references" : "items reference"
        } this Media. Archiving keeps it served and keeps those references intact; you can restore it later. References embedded in rich text or page data are not counted.`
      : "Archived Media leave the library but keep being served and referenced. You can restore them later.";

  const deleteDescription =
    usageCount > 0
      ? `This would remove the file and every rendition, but ${usageCount} content ${
          usageCount === 1 ? "item still references" : "items still reference"
        } it, so the deletion will be refused. Remove those references first. References embedded in rich text or page data are not counted.`
      : "This permanently removes the file and every generated rendition. It cannot be undone. References embedded in rich text or page data are not counted and cannot be protected.";

  return (
    <div
      data-media-id={id}
      data-selected={selected || undefined}
      onClick={() => onSelect(id)}
      className={`relative group cursor-pointer hover:shadow-2xs transition overflow-hidden border rounded-lg h-full ${
        selected ? "ring-2 ring-ring border-transparent" : ""
      }`}
    >
      {/* The actions are a second surface: using them must not change which
          item the details panel is describing. */}
      <div
        className="absolute p-4 z-10 w-full flex items-start justify-between gap-x-2"
        onClick={(event) => event.stopPropagation()}
      >
        <Checkbox checked={checked} onCheckedChange={handleCheckboxChange} />
        <div className="flex flex-wrap justify-end gap-x-2 gap-y-2">
          {!isArchived ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={onHandleReplace}
              >
                Replace
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={onHandleEdit}
              >
                Edit
              </Button>
              <ArchiveConfirm
                description={archiveDescription}
                disabled={isLoading}
                onConfirm={onArchive}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label={`More actions for ${name}`}
                    disabled={isLoading}
                  >
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    disabled={isLoading}
                    onSelect={() => onMove(id)}
                  >
                    <FolderInput />
                    Move to folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={onRestore}
              >
                <ArchiveRestore />
                Restore
              </Button>
              <DeleteConfirm
                description={deleteDescription}
                disabled={isLoading}
                onConfirm={onDelete}
              />
            </>
          )}
        </div>
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
          <div className="flex items-center gap-x-2">
            {isArchived && <Badge variant="secondary">Archived</Badge>}
            <Badge>{type}</Badge>
          </div>
        </div>
        <dl className="flex flex-col gap-y-2">
          <MediaDetailRow label="Size" value={formatBytes(size || 0)} />
          {dimensions && (
            <MediaDetailRow label="Dimensions" value={dimensions} />
          )}
          {mimeType && <MediaDetailRow label="MIME" value={mimeType} />}
          {checksum && (
            <MediaDetailRow
              label="Checksum"
              value={checksum.slice(0, 12)}
              title={checksum}
              mono
            />
          )}
          {revision > 1 && (
            <MediaDetailRow label="Revision" value={`v${revision}`} />
          )}
          <MediaDetailRow
            label="Used in"
            value={`${usageCount} relational ${
              usageCount === 1 ? "reference" : "references"
            }`}
            title="References embedded in rich text or page data are not counted"
          />
        </dl>
      </div>
    </div>
  );
};

function ArchiveConfirm({
  description,
  disabled,
  onConfirm,
}: {
  description: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      title="Archive this Media?"
      description={description}
      confirmLabel="Archive"
      onConfirm={onConfirm}
    >
      <Button variant="outline" size="sm" disabled={disabled}>
        <Archive />
        Archive
      </Button>
    </ConfirmModal>
  );
}

function DeleteConfirm({
  description,
  disabled,
  onConfirm,
}: {
  description: string;
  disabled: boolean;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      title="Delete this Media permanently?"
      description={description}
      confirmLabel="Delete permanently"
      onConfirm={onConfirm}
    >
      <Button variant="destructive" size="sm" disabled={disabled}>
        <Trash />
        Delete
      </Button>
    </ConfirmModal>
  );
}
