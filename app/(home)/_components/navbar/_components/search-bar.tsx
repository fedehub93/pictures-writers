"use client";
import { Search } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";
import { usePostsQuery } from "@/hooks/use-posts-query";
import { useState } from "react";
import { BeatLoader } from "react-spinners";
import { Category, Media, Post, User } from "@prisma/client";
import Link from "next/link";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";
import Image from "next/image";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export const SearchBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useDebounceValue("", 500);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    usePostsQuery(debouncedSearch);

  const onHandleOpen = () => {
    setIsOpen(!isOpen);
  };
  return (
    <div>
      <Button
        role="button"
        size="icon"
        variant="ghost"
        onClick={onHandleOpen}
        className="md:hidden"
      >
        <Search className="h-4 w-4" />
      </Button>
      <div
        className={cn(
          "bg-white fixed top-[80px] left-0 h-0 w-screen transition-all duration-500 overflow-hidden px-6 shadow-xl opacity-0 md:hidden",
          isOpen && "h-auto min-h-20 opacity-100"
        )}
      >
        <div className="w-full">
          <Input
            id="search"
            name="search"
            onChange={(e) => {
              setDebouncedSearch(e.target.value);
            }}
            className="my-4 shadow-lg border-2 border-primary"
          />
        </div>
        <div className="md:hidden">
          {debouncedSearch && (
            <ScrollArea className="max-h-[600px] md:max-h-[400px] overflow-auto">
              {status === "pending" ? (
                <div className="flex h-full flex-col flex-1 justify-center items-center py-8">
                  <BeatLoader />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Caricando articoli ...
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center py-4 gap-y-4">
                  {data?.pages?.map((group, i) => (
                    <div key={i} className="flex flex-col items-center gap-y-4">
                      {group.items.map(
                        (
                          item: Post & {
                            imageCover: Media | null;
                            category: Category | null;
                            user: User | null;
                          }
                        ) => (
                          <Link
                            href={`/${item.slug}`}
                            key={item.title}
                            className="relative flex gap-x-4 gap-y-8 group w-full"
                            prefetch={true}
                            onClick={() => setIsOpen(false)}
                          >
                            <div className="relative w-14 h-14 aspect-square top-0 transition-all duration-300 self-start">
                              <Image
                                src={item.imageCover?.url!}
                                alt={item.imageCover?.altText || ""}
                                fill
                                className="object-cover rounded-md"
                              />
                            </div>
                            <div className="flex flex-col gap-y-2 justify-evenly">
                              <p className="text-base font-medium leading-4">
                                {item.title}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="self-end text-xs text-muted-foreground">
                                  Pubblicato{" "}
                                  {formatDistance(
                                    item.publishedAt,
                                    new Date(),
                                    {
                                      addSuffix: true,
                                      locale: it,
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          </Link>
                        )
                      )}
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
          )}
        </div>
      </div>
    </div>
  );
};
