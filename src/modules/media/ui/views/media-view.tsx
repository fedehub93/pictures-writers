"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useMutation } from "@tanstack/react-query";
import { Archive, Trash } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import { DataPagination } from "@/shared/components/data-pagination";
import { ErrorState } from "@/shared/components/error-state";
import { LoadingState } from "@/shared/components/loading-state";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { DEFAULT_PAGE, type MediaLibraryView } from "../../constants";
import { mediaErrorMessage } from "../../lib/error-message";
import { mediaDeletionCleanupNotice } from "../../lib/deletion-notice";
import type { MediaFolderSummary } from "../../lib/media-folder";
import {
  MEDIA_USAGE_NOTE,
  type MediaLibraryEntry,
} from "../../lib/media-library";
import { useMediaFilters } from "../../hooks/use-media-filters";
import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import { useSuspenseMedia } from "../../hooks/use-media";

import { MediaGrid } from "../components/media-grid";
import { MediaFolderSidebar } from "../components/media-folder-sidebar";

export const MediaView = () => {
  const [filters, setFilters] = useMediaFilters();
  const { data } = useSuspenseMedia(filters);

  // Opening a folder is navigation inside My Drive: it always returns to page
  // one, because a page number belongs to the scope it was counted in.
  const openFolder = (folderId: string) =>
    setFilters({ view: "active", folderId, page: DEFAULT_PAGE });

  return (
    <div className="flex gap-6 px-6">
      <MediaFolderSidebar />
      <div className="min-w-0 flex-1">
        {/* Remounting on a filter change is what empties the selection: it never
            survives into a page, search, view or folder the admin cannot see. */}
        <MediaLibrary
          key={JSON.stringify([
            filters.search,
            filters.page,
            filters.view,
            filters.folderId,
          ])}
          items={data.items}
          folders={data.folders}
          view={filters.view}
          page={filters.page}
          totalPages={data.totalPages}
          onPageChange={(page) => setFilters({ page })}
          onOpenFolder={openFolder}
        />
      </div>
    </div>
  );
};

interface MediaLibraryProps {
  items: MediaLibraryEntry[];
  folders: MediaFolderSummary[];
  view: MediaLibraryView;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onOpenFolder: (folderId: string) => void;
}

const MediaLibrary = ({
  items,
  folders,
  view,
  page,
  totalPages,
  onPageChange,
  onOpenFolder,
}: MediaLibraryProps) => {
  const trpc = useTRPC();
  const { invalidateLibrary } = useMediaInvalidation();
  const archive = useMutation(trpc.media.archive.mutationOptions());
  const remove = useMutation(trpc.media.removeMany.mutationOptions());

  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // The grid and the batch consume only ids that are on screen right now, so a
  // row removed by a refetch after a refused action cannot be acted on and is
  // not drawn as checked.
  const selectedIds = checkedIds.filter((id) =>
    items.some((item) => item.id === id),
  );
  const canShowBulkAction = selectedIds.length > 0;
  const isBulkPending = isBulkLoading || archive.isPending || remove.isPending;

  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    setCheckedIds((current) =>
      isChecked
        ? [...new Set([...current, id])]
        : current.filter((candidate) => candidate !== id),
    );
  };

  const runBulkAction = async <T,>(
    action: (ids: string[]) => Promise<T>,
    announce: (result: T) => void,
  ) => {
    try {
      setIsBulkLoading(true);
      announce(await action(selectedIds));
      setCheckedIds([]);
    } catch (error) {
      toast.error(mediaErrorMessage(error));
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

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4">
        <p className="text-xs text-muted-foreground">{MEDIA_USAGE_NOTE}</p>
        {canShowBulkAction && (
          <div className="flex items-center gap-x-2">
            {view === "active" && (
              <ConfirmModal
                title="Archive selected Media?"
                description="Archived Media leave the library but keep being served and referenced by published content. You can restore them later."
                confirmLabel="Archive"
                onConfirm={onBulkArchive}
              >
                <Button disabled={isBulkPending} variant="outline" size="sm">
                  <Archive />
                  Archive
                </Button>
              </ConfirmModal>
            )}
            {view === "archived" && (
              <ConfirmModal
                title="Delete selected Media permanently?"
                description="Permanent deletion removes the file and every generated rendition. It cannot be undone, and it is refused while content still references a Media."
                confirmLabel="Delete permanently"
                onConfirm={onBulkDelete}
              >
                <Button disabled={isBulkPending} variant="destructive" size="sm">
                  <Trash />
                  Delete
                </Button>
              </ConfirmModal>
            )}
          </div>
        )}
      </div>
      <MediaGrid
        items={items}
        folders={folders}
        checkedIds={selectedIds}
        onCheckboxChange={handleCheckboxChange}
        onOpenFolder={onOpenFolder}
      />
      {items.length === 0 && folders.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          {view === "archived"
            ? "No archived Media found"
            : view === "recent"
              ? "No Media uploaded yet"
              : "No Media found"}
        </div>
      )}
      <DataPagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </>
  );
};

export const MediaViewLoading = () => {
  return (
    <LoadingState
      title="Loading Media"
      description="This may take a few seconds"
    />
  );
};

export const MediaViewError = () => {
  return <ErrorState title="Error Media" description="Something went wrong" />;
};
