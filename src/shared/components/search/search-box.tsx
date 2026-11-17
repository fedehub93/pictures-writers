"use client";
import "client-only";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";
import { SearchIcon } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";

import { usePostsInfiniteQuery } from "@/hooks/use-posts-infinite-query";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/shared/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { ScrollArea } from "@/shared/ui/scroll-area";
import { Skeleton } from "@/shared/ui/skeleton";

import type { GetPaginatedPosts } from "@/modules/blog/posts/server/queries";

import type { SearchBoxProps } from "./types";
import {
  SEARCH_BOX_DEFAULT_PLACEHOLDER,
  SEARCH_BOX_DEFAULT_VARIANT,
} from "./types";

const SEARCH_DEBOUNCE_MS = 400;

/**
 * The public blog search, extracted from the legacy navbar and sidebar widget.
 *
 * The component owns its query, debounce and result rendering so it can be used
 * anywhere (a Puck block, a widget, a page) without extra wiring. It only talks
 * to the public `/api/posts` endpoint through `usePostsInfiniteQuery`.
 */
export const SearchBox = ({
  placeholder = SEARCH_BOX_DEFAULT_PLACEHOLDER,
  variant = SEARCH_BOX_DEFAULT_VARIANT,
  className,
  id,
}: SearchBoxProps) => {
  if (variant === "compact") {
    return (
      <CompactSearchBox
        placeholder={placeholder}
        className={className}
        inputId={id}
      />
    );
  }

  return (
    <InlineSearchBox
      placeholder={placeholder}
      className={className}
      inputId={id}
    />
  );
};

type SearchViewProps = Required<Pick<SearchBoxProps, "placeholder">> &
  Pick<SearchBoxProps, "className"> & {
    inputId?: string;
  };

function InlineSearchBox({ placeholder, className, inputId }: SearchViewProps) {
  const search = usePostSearch(true);

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <SearchInput
        id={inputId}
        placeholder={placeholder}
        value={search.search}
        onChange={search.setSearch}
      />
      {search.showResults ? (
        <SearchResults
          className="rounded-md border bg-popover p-2 text-popover-foreground shadow-sm"
          {...search.results}
        />
      ) : null}
    </div>
  );
}

function CompactSearchBox({ placeholder, className, inputId }: SearchViewProps) {
  const [open, setOpen] = useState(false);
  const search = usePostSearch(open);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={className}
          aria-label={placeholder}
        >
          <SearchIcon data-icon="inline-start" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        <div className="flex flex-col gap-3">
          <SearchInput
            id={inputId}
            placeholder={placeholder}
            value={search.search}
            onChange={search.setSearch}
          />
          {search.showResults ? (
            <SearchResults
              {...search.results}
              onNavigate={() => setOpen(false)}
            />
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function usePostSearch(enabled: boolean) {
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounceValue(search, SEARCH_DEBOUNCE_MS);

  const query = usePostsInfiniteQuery({
    s: debouncedSearch,
    windowIsOpen: enabled,
  });

  const posts = query.data?.pages.flatMap((page) => page.posts) ?? [];
  const showResults = Boolean(search.trim() && debouncedSearch.trim());

  return {
    search,
    setSearch,
    showResults,
    results: {
      posts,
      status: query.status,
      hasNextPage: query.hasNextPage,
      isFetchingNextPage: query.isFetchingNextPage,
      fetchNextPage: query.fetchNextPage,
    },
  };
}

function SearchInput({
  id,
  placeholder,
  value,
  onChange,
}: {
  id?: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        type="search"
        placeholder={placeholder}
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <InputGroupAddon align="inline-end">
        <SearchIcon />
      </InputGroupAddon>
    </InputGroup>
  );
}

function SearchMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="border-0 p-4 md:p-6">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchIcon />
        </EmptyMedia>
        <EmptyTitle className="text-sm">{title}</EmptyTitle>
        <EmptyDescription className="text-xs">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

type SearchResultPost = GetPaginatedPosts["posts"][number];

type SearchResultsProps = {
  posts: SearchResultPost[];
  status: "pending" | "error" | "success";
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  onNavigate?: () => void;
  className?: string;
};

function SearchResults({
  posts,
  status,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  onNavigate,
  className,
}: SearchResultsProps) {
  return (
    <div className={className}>
      <ScrollArea className="max-h-80 overflow-auto">
        {status === "pending" ? (
          <div className="flex flex-col gap-2 p-1">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : status === "error" ? (
          <SearchMessage
            title="Search unavailable"
            description="Please try again in a moment."
          />
        ) : posts.length === 0 ? (
          <SearchMessage
            title="No results"
            description="Try a different search term."
          />
        ) : (
          <div className="flex flex-col gap-1 p-1">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/${post.slug}/` as Route}
                prefetch={false}
                onClick={onNavigate}
                className="group flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                {post.imageCover?.url ? (
                  <div className="relative size-14 shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={post.imageCover.url}
                      alt={post.imageCover.altText || ""}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="truncate text-sm font-medium">{post.title}</p>
                  {post.publishedAt ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDistance(post.publishedAt, new Date(), {
                        addSuffix: true,
                        locale: it,
                      })}
                    </p>
                  ) : null}
                </div>
              </Link>
            ))}
            {hasNextPage ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mx-auto mt-2"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage ? "Loading more..." : "Load more"}
              </Button>
            ) : null}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
