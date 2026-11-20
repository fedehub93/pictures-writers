"use client";
import { MediaType } from "@/generated/prisma";
import Image from "next/image";
import { File, Loader2 } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Separator } from "@/shared/ui/separator";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Button } from "@/shared/ui/button";
import { MEDIA_SEARCH_DEBOUNCE_MS } from "@/modules/media/constants";
import { MediaCreateAction } from "@/modules/media/ui/components/media-create-action";
import { useMediaInfiniteQuery } from "@/modules/media/hooks/use-media-infinite-query";
import type { MediaLibraryEntry } from "@/modules/media/lib/media-library";

export const SelectAssetModal = () => {
  const { isOpen, onClose, type, onCallback } = useModal();
  const [debouncedSearch, setDebouncedSearch] = useDebounceValue(
    "",
    MEDIA_SEARCH_DEBOUNCE_MS,
  );

  const isModalOpen = isOpen && type === "selectAsset";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useMediaInfiniteQuery({
      search: debouncedSearch,
      enabled: isModalOpen,
    });

  if (isModalOpen && status === "error") {
    return (
      <div className="flex h-full flex-col flex-1 justify-center items-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong
        </p>
      </div>
    );
  }

  const onSelect = (media: MediaLibraryEntry) => {
    onCallback(media);
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-white text-black p-0 overflow-hidden max-w-4xl">
        <DialogHeader>
          <div className="flex flex-col justify-center w-full py-4 px-6 gap-y-4">
            <DialogTitle className="flex justify-between text-xl  font-normal">
              Add existing asset
            </DialogTitle>
            <MediaCreateAction className="max-w-40 self-center" />
          </div>
          <Separator />
          <div className="flex flex-col gap-y-2 px-6">
            <span>Search for assets</span>
            <Input
              onChange={(e) => {
                setDebouncedSearch(e.target.value);
              }}
            />
          </div>
        </DialogHeader>
        <ScrollArea className=" max-h-100">
          {isModalOpen && status === "pending" ? (
            <div className="flex h-full flex-col flex-1 justify-center items-center py-8">
              <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Loading assets ...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 px-6 gap-y-4">
              <div className="flex flex-wrap justify-center gap-4">
                {data?.pages.flatMap((group) =>
                  group.items.map((item) => (
                    <div
                      key={item.id}
                      className="relative w-64 rounded-md aspect-video overflow-hidden cursor-pointer hover:scale-105 duration-500 transition-all"
                    >
                      {item.type === MediaType.IMAGE && (
                        <Image
                          src={item.url}
                          alt={item.altText || item.name}
                          onClick={() => onSelect(item)}
                          fill
                          sizes="35vw"
                          className="object-cover rounded-md"
                        />
                      )}
                      {item.type === MediaType.FILE && (
                        <div className="relative w-full h-full overflow-hidden aspect-video">
                          <File
                            onClick={() => onSelect(item)}
                            className="absolute w-full h-full border-2 border-black"
                            strokeWidth={1}
                          />
                          {item.name}
                        </div>
                      )}
                    </div>
                  )),
                )}
              </div>
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
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
