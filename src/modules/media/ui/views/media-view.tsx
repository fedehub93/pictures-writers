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

import type { MediaLibraryView } from "../../constants";
import { mediaErrorMessage } from "../../lib/error-message";
import {
  MEDIA_USAGE_NOTE,
  type MediaLibraryEntry,
} from "../../lib/media-library";
import { useMediaFilters } from "../../hooks/use-media-filters";
import { useMediaInvalidation } from "../../hooks/use-media-invalidation";
import { useSuspenseMedia } from "../../hooks/use-media";

import { MediaGrid } from "../components/media-grid";

export const MediaView = () => {
  const [filters, setFilters] = useMediaFilters();
  const { data } = useSuspenseMedia(filters);

  return (
    <div className="px-6">
      {/* Remounting on a filter change is what empties the selection: it never
          survives into a page, search or view the admin cannot see. */}
      <MediaLibrary
        key={JSON.stringify([filters.search, filters.page, filters.view])}
        items={data.items}
        view={filters.view}
        page={filters.page}
        totalPages={data.totalPages}
        onPageChange={(page) => setFilters({ page })}
      />
    </div>
  );
};

interface MediaLibraryProps {
  items: MediaLibraryEntry[];
  view: MediaLibraryView;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const MediaLibrary = ({
  items,
  view,
  page,
  totalPages,
  onPageChange,
}: MediaLibraryProps) => {
  const trpc = useTRPC();
  const { invalidateLibrary } = useMediaInvalidation();
  const archive = useMutation(trpc.media.archive.mutationOptions());
  const remove = useMutation(trpc.media.removeMany.mutationOptions());

  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

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

  const runBulkAction = async (
    action: () => Promise<number>,
    success: (count: number) => string,
  ) => {
    try {
      setIsBulkLoading(true);
      const count = await action();
      toast.success(success(count));
      setCheckedIds([]);
      await invalidateLibrary();
    } catch (error) {
      toast.error(mediaErrorMessage(error));
    } finally {
      setIsBulkLoading(false);
    }
  };

  const onBulkArchive = () =>
    runBulkAction(
      () => archive.mutateAsync({ ids: selectedIds }),
      (count) => `Archived ${count} Media`,
    );

  const onBulkDelete = () =>
    runBulkAction(
      () => remove.mutateAsync({ ids: selectedIds }),
      (count) => `Deleted ${count} Media permanently`,
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
        checkedIds={checkedIds}
        onCheckboxChange={handleCheckboxChange}
      />
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          {view === "archived" ? "No archived Media found" : "No Media found"}
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
