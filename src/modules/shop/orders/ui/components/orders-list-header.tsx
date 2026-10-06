"use client";

import { ArrowDownIcon, PlusCircleIcon } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ContentHeader } from "@/app/(admin)/_components/content/content-header";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { useOrderFilters } from "../../hooks/use-orders-filter";
import { useOpenOrder } from "../../hooks/use-open-order";

import { OrdersSearchFilter } from "./orders-search-filter";

export const OrdersListHeader = () => {
  const [filters] = useOrderFilters();
  const { onOpen } = useOpenOrder();
  const canCreate = usePermission(PERMISSIONS.ORDERS_CREATE);
  const trpc = useTRPC();

  const { data } = useQuery(trpc.orders.getMany.queryOptions(filters));

  return (
    <div className="flex flex-col gap-y-4 px-6 py-4">
      <ContentHeader label="Orders" totalEntries={data?.total ?? 0} />
      <div className="flex items-center justify-between gap-2">
        <OrdersSearchFilter />
        {canCreate && (
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
                New order
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};
