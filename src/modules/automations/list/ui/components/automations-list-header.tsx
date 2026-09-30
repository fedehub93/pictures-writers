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

import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { DEFAULT_PAGE } from "../../../constants";

import { useAutomationsFilters } from "../../../hooks/use-automations-filters";
import { useOpenAutomation } from "../../../hooks/use-open-automation";

import { AutomationsSearchFilter } from "./automations-search-filter";
import { AutomationsStatusFilter } from "./automations-status-filter";

export const AutomationsListHeader = () => {
  const [filters, setFilters] = useAutomationsFilters();
  const { onOpen } = useOpenAutomation();
  const trpc = useTRPC();
  const canWrite = usePermission(PERMISSIONS.AUTOMATIONS_WRITE);

  const { data } = useQuery(trpc.automations.getMany.queryOptions(filters));

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
      <ContentHeader label="Automations" totalEntries={data?.total ?? 0} />
      <div className="flex justify-between">
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <AutomationsSearchFilter />
            <AutomationsStatusFilter />
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
              {canWrite && (
                <DropdownMenuItem onClick={() => onOpen()}>
                  <PlusCircleIcon />
                  New Automation
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};