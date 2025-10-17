"use client";
import Image from "next/image";
import { Loader2 } from "lucide-react";
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

import { GetPaginatedPosts } from "@/data/post";

import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { usePostsInfiniteQuery } from "@/hooks/use-posts-infinite-query";

export const SelectPostModal = () => {
  const { isOpen, onClose, type, onCallback } = useModal();
  const [debouncedSearch, setDebouncedSearch] = useDebounceValue("", 1000);

  const isModalOpen = isOpen && type === "selectPost";

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    usePostsInfiniteQuery({
      s: debouncedSearch,
      minChar: false,
      windowIsOpen: isModalOpen,
    });

  if (isOpen && status === "error") {
    return (
      <div className="flex h-full flex-col flex-1 justify-center items-center">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Something went wrong
        </p>
      </div>
    );
  }

  const onSelect = async (post: GetPaginatedPosts["posts"][number]) => {
    onCallback(post);
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
            Add existing post
          </DialogTitle>
          <Separator />
          <div className="flex flex-col gap-y-2 px-6">
            <span>Search for post</span>
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
                Loading posts ...
              </p>
            </div>
          ) : (
            <div className="flex flex-col py-4 px-6 gap-y-4">
              {data?.pages?.map((group, i) => (
                <div key={i} className="flex flex-wrap gap-4">
                  {group.posts.map((item) => (
                    <div
                      key={item.title}
                      className="flex flex-col gap-y-2 pb-4 w-60 border cursor-pointer hover:scale-[1.02] hover:shadow-xl duration-500 transition-all rounded-md shadow-md"
                    >
                      <div className="relative w-60 aspect-video overflow-hidden border-b">
                        <Image
                          src={item.imageCover?.url || ""}
                          alt={item.imageCover?.altText || ""}
                          onClick={() => onSelect(item)}
                          fill
                          className="object-cover rounded-md"
                          unoptimized
                        />
                      </div>
                      <div className="text-sm px-2 line-clamp-2">
                        {item.title}
                      </div>
                      <div className="self-center">
                        {/* <Badge className="text-xs">{item.category}</Badge> */}
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
