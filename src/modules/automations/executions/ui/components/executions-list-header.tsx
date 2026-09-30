"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon, XCircleIcon } from "lucide-react";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import { ScrollArea, ScrollBar } from "@/shared/ui/scroll-area";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";

import { DEFAULT_PAGE } from "../../../constants";
import { useExecutionsFilters } from "../../hooks/use-executions";

import { ExecutionsFilters } from "./executions-filters";

export const ExecutionsListHeader = ({
  automationId,
}: {
  automationId: string;
}) => {
  const [filters, setFilters] = useExecutionsFilters();
  const trpc = useTRPC();

  const { data } = useQuery(
    trpc.automations.getRuns.queryOptions({
      automationId,
      page: filters.page,
      status: filters.status,
      from: filters.from,
      to: filters.to,
    }),
  );

  const isAnyFilterModified = !!filters.status || !!filters.from || !!filters.to;

  const onClearFilters = () => {
    setFilters({
      status: null,
      from: null,
      to: null,
      page: DEFAULT_PAGE,
    });
  };

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <div className="flex items-center gap-x-2">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link
            href={`/admin/automations/${automationId}/`}
            aria-label="Back to editor"
          >
            <ArrowLeftIcon />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <ContentHeader label="Executions" totalEntries={data?.total ?? 0} />
        </div>
      </div>
      <div className="flex justify-between">
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <ExecutionsFilters />
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
      </div>
    </div>
  );
};
