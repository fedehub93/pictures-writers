"use client";

import { Media } from "@prisma/client";
import { useState } from "react";

import { AssetCard } from "./asset-card";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";
import { Trash } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface AssetListProps {
  items: Media[];
}

interface AssetWithCheckbox extends Media {
  isChecked: boolean;
}

export const AssetsList = ({ items }: AssetListProps) => {
  const router = useRouter();
  const [assets, setAssets] = useState<AssetWithCheckbox[]>(
    items.map((item) => ({ ...item, isChecked: false }))
  );
  const [isLoading, setIsLoading] = useState(false);

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
        <h2 className="sm:mt-2">Assets ({assets.length})</h2>
        {canShowDelete && (
          <ConfirmModal onConfirm={onDelete}>
            <Button disabled={isLoading} variant="destructive" size="sm">
              <Trash />
            </Button>
          </ConfirmModal>
        )}
      </div>
      <div className="grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4 gap-4">
        {assets.map((item) => (
          <AssetCard
            key={item.id}
            id={item.id}
            name={item.name}
            url={item.url}
            type={item.type}
            onCheckboxChange={handleCheckboxChange}
          />
        ))}
      </div>
      {items.length === 0 && (
        <div className="text-center text-sm text-muted-foreground mt-10">
          No assets found
        </div>
      )}
    </div>
  );
};
