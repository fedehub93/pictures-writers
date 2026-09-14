"use client";

import { createColumnHelper } from "@tanstack/react-table";

import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@/trpc/routers/_app";

import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";

import type { DataTableFeatures } from "./data-table-features";
import { UsersActions } from "./actions";

type User = inferRouterOutputs<AppRouter>["users"]["getMany"]["users"][number];

export type UsersDataTableFeatures = DataTableFeatures;

interface UsersColumnsContext {
  roles: { id: string; name: string }[];
}

const columnHelper = createColumnHelper<DataTableFeatures, User>();

export const createColumns = ({ roles }: UsersColumnsContext) =>
  columnHelper.columns([
    columnHelper.accessor("imageUrl", {
      id: "photo",
      header: () => <span className="sr-only">Photo</span>,
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const imageUrl = row.original.imageUrl;
        const fullName =
          [row.original.firstName, row.original.lastName]
            .filter(Boolean)
            .join(" ") ||
          row.original.name ||
          row.original.email ||
          "User";
        return (
          <Avatar className="size-9">
            {imageUrl ? (
              <AvatarImage
                src={imageUrl}
                alt={fullName}
                className="object-cover"
              />
            ) : null}
            <AvatarFallback>
              {fullName
                .split(" ")
                .map((part) => part[0])
                .filter(Boolean)
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>
        );
      },
    }),
    columnHelper.accessor(
      (row) =>
        [row.firstName, row.lastName].filter(Boolean).join(" ") ||
        row.name ||
        "Unnamed",
      {
        id: "name",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Name" />
        ),
        sortFn: "text",
      },
    ),
    columnHelper.accessor("email", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      sortFn: "text",
      cell: ({ row }) => row.original.email ?? "-",
    }),
    columnHelper.accessor((row) => row.roleDefinition?.name, {
      id: "role",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      enableSorting: false,
      cell: ({ row }) => row.original.roleDefinition?.name ?? "-",
    }),
    columnHelper.accessor("accountStatus", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      sortFn: "text",
      cell: ({ row }) => {
        const status = row.original.accountStatus;
        return (
          <Badge
            className={cn(
              status === "ACTIVE" && "bg-emerald-700",
              status === "SUSPENDED" && "bg-slate-700",
            )}
          >
            {status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <UsersActions user={row.original} roles={roles} />
        </div>
      ),
      enableHiding: false,
    }),
  ]);