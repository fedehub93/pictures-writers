"use client";

import { useState } from "react";
import { Archive, Trash } from "lucide-react";
import axios from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";

import {
  MEDIA_USAGE_NOTE,
  type MediaLibraryEntry,
  type MediaLibraryView,
} from "@/modules/media/lib/media-library";

import { apiErrorMessage } from "@/shared/lib/api-error";
import { Button } from "@/shared/ui/button";
import { AssetCard } from "./asset-card";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { ExtendedPagination } from "@/shared/components/extended-pagination";
import { SearchInput } from "@/app/(admin)/_components/search-input";
import { MediaActions } from "./actions";

interface AssetListProps {
  items: MediaLibraryEntry[];
  view: MediaLibraryView;
  pagination: {
    page: number;
    perPage: number;
    totalRecords: number;
    totalPages: number;
  };
}

export const AssetsList = ({ items, view, pagination }: AssetListProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const selectedIds = checkedIds.filter((id) =>
    items.some((item) => item.id === id),
  );
  const canShowBulkAction = selectedIds.length > 0;

  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    setCheckedIds((current) =>
      isChecked
        ? [...new Set([...current, id])]
        : current.filter((candidate) => candidate !== id),
    );
  };

  const buildViewHref = (next: MediaLibraryView) => {
    const params = new URLSearchParams(searchParams);
    params.set("view", next);
    params.delete("page");
    return `/admin/media?${params.toString()}` as const;
  };

  const onBulkArchive = async () => {
    try {
      setIsLoading(true);

      await Promise.all(
        selectedIds.map((id) => axios.post(`/api/media/${id}/archive`)),
      );
      toast.success(
        `Archived ${selectedIds.length} ${
          selectedIds.length === 1 ? "asset" : "assets"
        }`,
      );
      setCheckedIds([]);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Something went wrong"));
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };

  const onBulkDelete = async () => {
    try {
      setIsLoading(true);

      await axios.delete("/api/media/bulk_delete", { data: selectedIds });
      toast.success(
        `Deleted ${selectedIds.length} ${
          selectedIds.length === 1 ? "asset" : "assets"
        } permanently`,
      );
      setCheckedIds([]);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Something went wrong"));
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-wrap gap-4 items-center py-4">
        <div className="flex items-center gap-x-4 mr-auto">
          <SearchInput />
          <div className="flex items-center gap-x-2">
            <Button
              asChild
              size="sm"
              variant={view === "active" ? "default" : "outline"}
            >
              <Link href={buildViewHref("active")}>Library</Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant={view === "archived" ? "default" : "outline"}
            >
              <Link href={buildViewHref("archived")}>Archived</Link>
            </Button>
          </div>
          {view === "active" && canShowBulkAction && (
            <ConfirmModal
              title="Archive selected assets?"
              description="Archived media leave the library but keep being served and referenced by published content. You can restore them later."
              confirmLabel="Archive"
              onConfirm={onBulkArchive}
            >
              <Button disabled={isLoading} variant="outline" size="sm">
                <Archive />
              </Button>
            </ConfirmModal>
          )}
          {view === "archived" && canShowBulkAction && (
            <ConfirmModal
              title="Delete selected assets permanently?"
              description="Permanent deletion removes the file and every generated rendition. It cannot be undone, and it is refused while content still references an asset."
              confirmLabel="Delete permanently"
              onConfirm={onBulkDelete}
            >
              <Button disabled={isLoading} variant="destructive" size="sm">
                <Trash />
              </Button>
            </ConfirmModal>
          )}
        </div>
        {view === "active" && <MediaActions />}
      </div>
      <p className="text-xs text-muted-foreground pb-4">{MEDIA_USAGE_NOTE}</p>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4 mb-4">
        {items.map((item) => (
          <AssetCard
            key={item.id}
            media={item}
            onCheckboxChange={handleCheckboxChange}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          {view === "archived"
            ? "No archived assets found"
            : "No assets found"}
        </div>
      )}
      <ExtendedPagination
        page={pagination.page}
        perPage={pagination.perPage}
        totalRecords={pagination.totalRecords}
        totalPages={pagination.totalPages}
      />
    </div>
  );
};
