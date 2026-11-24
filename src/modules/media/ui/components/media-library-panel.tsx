"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { Archive, ChevronRight, FolderInput, Trash } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import { DataPagination } from "@/shared/components/data-pagination";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { type MediaLibraryView } from "@/modules/media/constants";
import { mediaErrorMessage } from "@/modules/media/lib/error-message";
import { mediaDeletionCleanupNotice } from "@/modules/media/lib/deletion-notice";
import {
  mediaFolderPath,
  type MediaFolderDetails,
  type MediaFolderNode,
  type MediaFolderSummary,
} from "@/modules/media/lib/media-folder";
import {
  MEDIA_USAGE_NOTE,
  type MediaLibraryEntry,
} from "@/modules/media/lib/media-library";
import { useMediaInvalidation } from "@/modules/media/hooks/use-media-invalidation";

import { MediaDetailsPanel } from "./media-details-panel";
import { MediaGrid } from "./media-grid";

interface MediaLibraryPanelProps {
  items: MediaLibraryEntry[];
  folders: MediaFolderSummary[];
  folder: MediaFolderDetails | null;
  folderPending: boolean;
  view: MediaLibraryView;
  page: number;
  totalPages: number;
  folderTree: MediaFolderNode[];
  onPageChange: (page: number) => void;
  onOpenFolder: (folderId: string) => void;
  /** Called when a card menu or the bulk toolbar asks to move one or more Media. */
  onRequestMove: (ids: string[]) => void;
  /** Controlled checked ids so the parent can clear them after a move. */
  checkedIds: string[];
  onCheckedIdsChange: (ids: string[]) => void;
}

/**
 * The bordered panel that shows the My Drive or Archived grid, its pagination,
 * the bulk action bar and the in-panel details column. Selection is controlled
 * by the parent so a successful move can clear the checkboxes.
 */
export const MediaLibraryPanel = ({
  items,
  folders,
  folder,
  folderPending,
  view,
  page,
  totalPages,
  folderTree,
  onPageChange,
  onOpenFolder,
  onRequestMove,
  checkedIds,
  onCheckedIdsChange,
}: MediaLibraryPanelProps) => {
  const trpc = useTRPC();
  const { invalidateLibrary } = useMediaInvalidation();
  const archive = useMutation(trpc.media.archive.mutationOptions());
  const remove = useMutation(trpc.media.removeMany.mutationOptions());

  // The one Media whose details the panel describes. It is dropped when the
  // row is no longer on screen, so the panel cannot outlive its subject.
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const selectedMedia =
    items.find((item) => item.id === selectedMediaId) ?? null;
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // The grid and the batch consume only ids that are on screen right now, so a
  // row removed by a refetch after a refused action cannot be acted on and is
  // not drawn as checked.
  const selectedIds = checkedIds.filter((id) =>
    items.some((item) => item.id === id),
  );
  const canShowBulkAction = selectedIds.length > 0;
  const isBulkPending =
    isBulkLoading || archive.isPending || remove.isPending;

  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    onCheckedIdsChange(
      isChecked
        ? [...new Set([...checkedIds, id])]
        : checkedIds.filter((candidate) => candidate !== id),
    );
  };

  const runBulkAction = async <T,>(
    action: (ids: string[]) => Promise<T>,
    announce: (result: T) => void,
    ids: string[] = selectedIds,
  ): Promise<boolean> => {
    try {
      setIsBulkLoading(true);
      announce(await action(ids));
      // Only the rows this action consumed stop being checked: a card's move
      // must not drop a selection the editor made for another batch.
      onCheckedIdsChange(
        checkedIds.filter((candidate) => !ids.includes(candidate)),
      );
      return true;
    } catch (error) {
      toast.error(mediaErrorMessage(error));
      return false;
    } finally {
      // A refused batch writes nothing, but the resync repairs drift from
      // another tab and proves the rows, count and quota the admin sees.
      await invalidateLibrary();
      setIsBulkLoading(false);
    }
  };

  const onBulkArchive = () =>
    runBulkAction(
      (ids) => archive.mutateAsync({ ids }),
      (count) => toast.success(`Archived ${count} Media`),
    );

  const onBulkDelete = () =>
    runBulkAction(
      (ids) => remove.mutateAsync({ ids }),
      ({ deleted, cleanup }) => {
        toast.success(`Deleted ${deleted} Media permanently`);

        const notice = mediaDeletionCleanupNotice(cleanup);
        if (notice) toast(notice);
      },
    );

  const isMyDrive = view === "active";

  return (
    <section
      aria-label={isMyDrive ? "My Drive" : "Archived"}
      className="rounded-lg border"
    >
      <div className="flex flex-col gap-y-3 border-b p-4">
        <MediaPanelHeader
          view={view}
          folder={folder}
          folderTree={folderTree}
          onOpenFolder={onOpenFolder}
        />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{MEDIA_USAGE_NOTE}</p>
          {canShowBulkAction && (
            <div className="flex items-center gap-x-2">
              {isMyDrive && (
                <Button
                  disabled={isBulkPending}
                  variant="outline"
                  size="sm"
                  onClick={() => onRequestMove(selectedIds)}
                >
                  <FolderInput />
                  Move to folder
                </Button>
              )}
              {isMyDrive && (
                <ConfirmModal
                  title="Archive selected Media?"
                  description="Archived Media leave the library but keep being served and referenced by published content. You can restore them later."
                  confirmLabel="Archive"
                  onConfirm={onBulkArchive}
                >
                  <Button
                    disabled={isBulkPending}
                    variant="outline"
                    size="sm"
                  >
                    <Archive />
                    Archive
                  </Button>
                </ConfirmModal>
              )}
              {isMyDrive && (
                <ConfirmModal
                  title="Delete selected Media permanently?"
                  description="Permanent deletion removes the file and every generated rendition. It cannot be undone, and it is refused while content still references a Media."
                  confirmLabel="Delete permanently"
                  onConfirm={onBulkDelete}
                >
                  <Button
                    disabled={isBulkPending}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash />
                    Delete
                  </Button>
                </ConfirmModal>
              )}
              {!isMyDrive && (
                <ConfirmModal
                  title="Delete selected Media permanently?"
                  description="Permanent deletion removes the file and every generated rendition. It cannot be undone, and it is refused while content still references a Media."
                  confirmLabel="Delete permanently"
                  onConfirm={onBulkDelete}
                >
                  <Button
                    disabled={isBulkPending}
                    variant="destructive"
                    size="sm"
                  >
                    <Trash />
                    Delete
                  </Button>
                </ConfirmModal>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col xl:flex-row">
        <div className="min-w-0 flex-1 p-4">
          <MediaGrid
            items={items}
            folders={folders}
            checkedIds={selectedIds}
            selectedMediaId={selectedMediaId}
            showArchivedBadge={!isMyDrive}
            onCheckboxChange={handleCheckboxChange}
            onSelectMedia={setSelectedMediaId}
            onOpenFolder={onOpenFolder}
            onMove={(mediaId) => onRequestMove([mediaId])}
          />
          {items.length === 0 && folders.length === 0 && (
            <div className="text-center text-sm text-muted-foreground mt-10">
              {view === "archived"
                ? "No archived Media found"
                : "No Media found"}
            </div>
          )}
          <DataPagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </div>
        <div className="border-t xl:border-t-0 xl:border-l p-4 xl:w-72">
          <MediaDetailsPanel
            media={selectedMedia}
            folder={folder}
            folderPending={folderPending}
          />
        </div>
      </div>
    </section>
  );
};

function MediaPanelHeader({
  view,
  folder,
  folderTree,
  onOpenFolder,
}: {
  view: MediaLibraryView;
  folder: MediaFolderDetails | null;
  folderTree: MediaFolderNode[];
  onOpenFolder: (folderId: string) => void;
}) {
  if (view === "archived") {
    return <h2 className="text-sm font-medium">Archived</h2>;
  }

  const path = folder ? mediaFolderPath(folderTree, folder.id) : [];

  return (
    <nav aria-label="My Drive breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-1 text-sm">
        <li>
          <button
            type="button"
            onClick={() => onOpenFolder("")}
            className="font-medium hover:underline"
          >
            My Drive
          </button>
        </li>
        {path.map((segment) => (
          <li key={segment.id} className="flex items-center gap-x-1">
            <ChevronRight className="size-4 text-muted-foreground" />
            <button
              type="button"
              onClick={() => onOpenFolder(segment.id)}
              className="font-medium hover:underline"
            >
              {segment.name}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
