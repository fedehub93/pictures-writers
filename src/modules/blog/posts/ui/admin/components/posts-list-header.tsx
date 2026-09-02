"use client";

import { ArrowDownIcon, PlusCircleIcon, XCircleIcon } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DEFAULT_PAGE } from "../../../constants";

import { usePostsFilters } from "../../../hooks/use-posts-filters";
import { useOpenPost } from "../../../hooks/use-open-post";

import { StatusFilter } from "./posts-status-filter";
import { PostsSearchFilter } from "./posts-search-filter";

export const PostsListHeader = () => {
  const [filters, setFilters] = usePostsFilters();
  const { onOpen } = useOpenPost();
  const trpc = useTRPC();

  const { data } = useQuery(trpc.posts.getMany.queryOptions(filters));

  const isAnyFilterModified = !!filters.search || !!filters.status;

  const onClearFilters = () => {
    setFilters({
      search: "",
      page: DEFAULT_PAGE,
      status: null,
    });
  };

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader label="Posts" totalEntries={data?.total ?? 0} />
      <div className="flex justify-between">
        <div className="flex items-center gap-x-2 px-1">
          <PostsSearchFilter />
          <StatusFilter />
          {isAnyFilterModified && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearFilters}
              className="h-8"
            >
              <XCircleIcon data-icon="inline-start" />
              Clear
            </Button>
          )}
        </div>
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-8">
                Actions
                <ArrowDownIcon data-icon="inline-end" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen()}>
                <PlusCircleIcon />
                New Post
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
