"use client";

import { Search } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";
import { BeatLoader } from "react-spinners";
import { Category, Media, Post, User } from "@prisma/client";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";
import Image from "next/image";
import { usePostsQuery } from "@/hooks/use-posts-query";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const SidebarSearch = () => {
  const [debouncedSearch, setDebouncedSearch] = useDebounceValue("", 500);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    usePostsQuery(debouncedSearch);

  return (
    <div className="w-full bg-white px-6 py-8 shadow-md">
      <h3 className="mb-4 text-sm font-extrabold uppercase">Search</h3>
      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute top-3 left-3 text-slate-600" />
        <Input
          onChange={(e) => {
            setDebouncedSearch(e.target.value);
          }}
          className="pl-9"
          placeholder="Search..."
        />
      </div>
      {debouncedSearch && (
        <ScrollArea className=" max-h-[400px]">
          {status === "pending" ? (
            <div className="flex h-full flex-col flex-1 justify-center items-center py-8">
              <BeatLoader />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Loading assets ...
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 gap-y-4">
              {data?.pages?.map((group, i) => (
                <div key={i}>
                  {group.items.map(
                    (
                      item: Post & {
                        imageCover: Media | null;
                        category: Category | null;
                        user: User;
                      }
                    ) => (
                      <Link
                        href={item.slug}
                        key={item.title}
                        className="relative flex gap-x-4 group"
                      >
                        <div className="relative w-20 aspect-square group-hover:shadow-2xl top-0 group-hover:-top-1 transition-all duration-300">
                          <Image
                            src={item.imageCover?.url!}
                            alt={item.imageCover?.altText || ""}
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                        <div className="flex flex-col gap-y-2 justify-evenly">
                          <p className="text-base font-medium">{item.title}</p>
                          <div className="flex items-center justify-between">
                            <p className="self-end text-xs text-muted-foreground">
                              Pubblicato da {item.user.firstName}{" "}
                              {item.user.lastName}{" "}
                              {formatDistance(item.publishedAt, new Date(), {
                                addSuffix: true,
                                locale: it,
                              })}
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
  );
};

export default SidebarSearch;
