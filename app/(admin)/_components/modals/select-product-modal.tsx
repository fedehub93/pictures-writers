"use client";
import { Media, Product } from "@prisma/client";
import Image from "next/image";
import { File, Loader2 } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { useProductsQuery } from "../../_hooks/use-products-query";
import { Badge } from "@/components/ui/badge";

type ProductWithImageCover = Product & {
  imageCover: Media | null;
};

export const SelectProductModal = () => {
  const { isOpen, onClose, type, onCallback } = useModal();
  const [debouncedSearch, setDebouncedSearch] = useDebounceValue("", 1000);

  const isModalOpen = isOpen && type === "selectProduct";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useProductsQuery(debouncedSearch, isModalOpen);

  if (isOpen && status === "error") {
    return (
      <div className="flex h-full flex-col flex-1 justify-center items-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong
        </p>
      </div>
    );
  }

  const onSelect = async (product: Product) => {
    onCallback(product);
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
            Add existing product
          </DialogTitle>
          <Separator />
          <div className="flex flex-col gap-y-2 px-6">
            <span>Search for products</span>
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
            <div className="flex flex-col py-4 px-6 gap-y-4">
              {data?.pages?.map((group, i) => (
                <div key={i} className="flex gap-x-4">
                  {group.items.map((item: ProductWithImageCover) => (
                    <div
                      key={item.title}
                      className="flex flex-col gap-y-2 pb-4 w-40 border cursor-pointer hover:scale-[1.02] hover:shadow-xl duration-500 transition-all rounded-md shadow-md"
                    >
                      <div className="relative w-40 aspect-square overflow-hidden border-b">
                        <Image
                          src={item.imageCover?.url || ""}
                          alt={item.imageCover?.altText || ""}
                          onClick={() => onSelect(item)}
                          fill
                          className="object-contain rounded-md"
                        />
                      </div>
                      <div className="text-sm px-2 line-clamp-2">
                        {item.title}
                      </div>
                      <div className="self-center">
                        <Badge className="text-xs">{item.type}</Badge>
                      </div>
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
