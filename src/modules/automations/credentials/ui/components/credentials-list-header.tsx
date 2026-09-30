"use client";

import { ArrowDownIcon, PlusCircleIcon, XCircleIcon } from "lucide-react";
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

import { useTRPC } from "@/trpc/client";

import { DEFAULT_PAGE } from "../../../constants";
import { useCredentialsFilters } from "../../hooks/use-credentials-filters";
import { useOpenCredential } from "../../hooks/use-open-credential";
import { CredentialsSearchFilter } from "./credentials-search-filter";

export const CredentialsListHeader = () => {
  const [filters, setFilters] = useCredentialsFilters();
  const { onOpen } = useOpenCredential();
  const trpc = useTRPC();

  const { data } = useQuery(trpc.credentials.getMany.queryOptions(filters));

  const isAnyFilterModified = !!filters.search;

  const onClearFilters = () => {
    setFilters({ search: "", page: DEFAULT_PAGE });
  };

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader label="Credentials" totalEntries={data?.total ?? 0} />
      <div className="flex justify-between">
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <CredentialsSearchFilter />
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
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
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
                New Credential
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};
