"use client";
import { Media, MediaType } from "@prisma/client";
import Image from "next/image";
import { File, Loader2, Plus } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";

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
import { UploadButton } from "@/lib/uploadthing";
import { MediaActions } from "../../admin/(routes)/media/_components/actions";

export const SelectAssetModal = () => {
  const { isOpen, onClose, type, onCallback, onOpen } = useModal();
  const [debouncedSearch, setDebouncedSearch] = useDebounceValue("", 1000);

  const isModalOpen = isOpen && type === "selectAsset";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useAssetsQuery(debouncedSearch, isModalOpen);

  if (isOpen && status === "error") {
    return (
      <div className="flex h-full flex-col flex-1 justify-center items-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong
        </p>
      </div>
    );
  }

  const onSelect = async (asset: Media) => {
    onCallback(asset);
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
            <Button
              className="max-w-40 self-center"
              onClick={() => onOpen("createMediaAsset")}
            >
              <Plus />
              Create new asset
            </Button>
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
        <ScrollArea className=" max-h-[400px]">
          {isOpen && status === "pending" ? (
            <div className="flex h-full flex-col flex-1 justify-center items-center py-8">
              <Loader2 className="h-7 w-7 text-zinc-500 animate-spin my-4" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Loading assets ...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 px-6 gap-y-4">
              {data?.pages?.map((group, i) => (
                <div key={i} className="flex gap-x-4">
                  {group.items.map((item: Media) => (
                    <div
                      key={item.name}
                      className="relative w-64 rounded-md aspect-video overflow-hidden cursor-pointer hover:scale-105 duration-500 transition-all"
                    >
                      {item.type === MediaType.IMAGE && (
                        <Image
                          src={item.url}
                          alt={item.altText || "ciao"}
                          onClick={() => onSelect(item)}
                          fill
                          sizes="35vw"
                          className="object-cover rounded-md"
                          unoptimized
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
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
