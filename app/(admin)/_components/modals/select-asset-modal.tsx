"use client";
import { Loader2 } from "lucide-react";
import { Fragment } from "react";
import { Media } from "@prisma/client";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { useAssetsQuery } from "../../_hooks/use-assets-query";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

export const SelectAssetModal = () => {
  const { isOpen, onClose, type, onCallback } = useModal();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useAssetsQuery();

  if (isOpen && status === "pending") {
    return (
      <div className="flex h-full flex-col flex-1 justify-center items-center">
        <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Loading messages ...
        </p>
      </div>
    );
  }

  if (isOpen && status === "error") {
    return (
      <div className="flex h-full flex-col flex-1 justify-center items-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong
        </p>
      </div>
    );
  }

  const isModalOpen = isOpen && type === "selectAsset";

  const onSelect = async (url: string) => {
    onCallback({ url });
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl py-4 px-6 font-normal">
            Add existing asset
          </DialogTitle>
          <Separator />
          <div className="flex flex-col gap-y-2 px-6">
            <span>Search for assets</span>
            <Input />
          </div>
        </DialogHeader>
        <ScrollArea className="py-4 px-6 max-h-[400px]">
          <div className="flex flex-col items-center gap-y-4">
            {data?.pages?.map((group, i) => (
              <div key={i} className="flex gap-x-4">
                {group.items.map((item: Media) => (
                  <div
                    key={item.name}
                    className="relative w-64 rounded-md aspect-video overflow-hidden cursor-pointer hover:border-primary hover:border-2 transition-all"
                  >
                    <Image
                      src={item.url}
                      alt="ciao"
                      onClick={() => onSelect(item.url)}
                      fill
                      className="object-cover rounded-md hover:scale-110 transition-all duration-500"
                    />
                  </div>
                ))}
              </div>
            ))}
            <Button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={!hasNextPage || isFetchingNextPage}
              className="mt-4 mx-auto"
            >
              {isFetchingNextPage
                ? "Loading more..."
                : hasNextPage
                ? "Load More"
                : "Nothing more to load"}
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
