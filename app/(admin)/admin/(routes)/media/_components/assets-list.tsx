"use client";

import { useEffect, useState } from "react";
import { Trash } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Media } from "@prisma/client";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { AssetCard } from "./asset-card";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { ExtendedPagination } from "@/components/extended-pagination";
import { SearchInput } from "@/app/(admin)/_components/search-input";

interface AssetListProps {
  items: Media[];
  pagination: {
    page: number;
    perPage: number;
    totalRecords: number;
    totalPages: number;
  };
}

interface AssetWithCheckbox extends Media {
  isChecked: boolean;
}

export const AssetsList = ({ items, pagination }: AssetListProps) => {
  const router = useRouter();

  const [assets, setAssets] = useState<AssetWithCheckbox[]>(
    items.map((item) => ({ ...item, isChecked: false }))
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAssets(items.map((item) => ({ ...item, isChecked: false })));
  }, [items]);

  const canShowDelete = assets.some((asset) => asset.isChecked);

  const handleCheckboxChange = (id: string, isChecked: boolean) => {
    const updatedAssets = assets.map((asset) =>
      asset.id === id ? { ...asset, isChecked } : asset
    );
    setAssets(updatedAssets);
  };

  const onDelete = async () => {
    try {
      setIsLoading(true);

      const checkedAssets = assets
        .filter((asset) => asset.isChecked)
        .map((asset) => asset.id);

      await axios.delete("/api/media/bulk_delete", {
        data: checkedAssets,
      });
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      router.refresh();
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex gap-x-4 items-center">
        <h2>Assets ({pagination.totalRecords})</h2>
        <div className="flex items-center gap-x-4">
          <SearchInput />
          {canShowDelete && (
            <ConfirmModal onConfirm={onDelete}>
              <Button disabled={isLoading} variant="destructive" size="sm">
                <Trash />
              </Button>
            </ConfirmModal>
          )}
        </div>
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {assets.map((item) => (
          <AssetCard
            key={item.id}
            id={item.id}
            name={item.name}
            url={item.url}
            type={item.type}
            size={item.size || 0}
            onCheckboxChange={handleCheckboxChange}
          />
        ))}
      </div>
      {assets.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          No assets found
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
