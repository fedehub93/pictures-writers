"use client";

import { createColumnHelper } from "@tanstack/react-table";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import type { DataTableFeatures } from "./data-table-features";
import { RolesActions } from "./actions";

type Role = inferRouterOutputs<AppRouter>["roles"]["getMany"]["roles"][number];

export type RolesDataTableFeatures = DataTableFeatures;

interface RolesColumnsContext {
  canManage: boolean;
}

const columnHelper = createColumnHelper<DataTableFeatures, Role>();

export const createColumns = ({ canManage }: RolesColumnsContext) =>
  columnHelper.columns([
    columnHelper.accessor("name", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      sortFn: "text",
      cell: ({ row }) => {
        const role = row.original;
        return (
          <span className="font-medium">
            {role.name}
            {role.isSystem && (
              <Badge variant="outline" className="ml-2">
                System
              </Badge>
            )}
          </span>
        );
      },
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
      enableSorting: false,
      cell: ({ row }) => {
        const isActive = row.original.isActive;
        return (
          <Badge
            className={cn(isActive ? "bg-emerald-700" : "bg-slate-700")}
            variant={isActive ? "default" : "outline"}
          >
            {isActive ? "Active" : "Inactive"}
          </Badge>
        );
      },
    }),
    columnHelper.accessor((row) => row.permissions.length, {
      id: "permissions",
      header: "Permissions",
      enableSorting: false,
    }),
    columnHelper.accessor((row) => row._count.users, {
      id: "assignedUsers",
      header: "Assigned users",
      enableSorting: false,
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <RolesActions role={row.original} canManage={canManage} />
        </div>
      ),
      enableHiding: false,
    }),
  ]);