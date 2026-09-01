"use client";

import {
  ArrowDownIcon,
  PlusCircleIcon,
  XCircleIcon,
} from "lucide-react";

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
      <ContentHeader label="Posts" totalEntries={0} />
      <div className="flex justify-between">
        <ScrollArea>
          <div className="flex items-center gap-x-2 px-1">
            <PostsSearchFilter />
            <StatusFilter />
            {isAnyFilterModified && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <XCircleIcon data-icon="inline-start" />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" size="sm">
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
