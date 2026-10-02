"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";
import { Badge } from "@/shared/ui/badge";
import { formatDate } from "@/lib/format";

import { CustomersGetMany } from "../../types";

import { CustomersActions } from "./actions";
import { type DataTableFeatures } from "./data-table-features";

type Customer = CustomersGetMany["items"][number];

const columnHelper = createColumnHelper<DataTableFeatures, Customer>();

export const columns = columnHelper.columns([
  columnHelper.accessor("email", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    sortFn: "text",
    cell: ({ row }) => (
      <Link
        href={`/admin/shop/customers/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.email}
      </Link>
    ),
  }),
  columnHelper.accessor("name", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    sortFn: "text",
    cell: ({ row }) => row.original.name ?? "—",
  }),
  columnHelper.accessor("phone", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    sortFn: "text",
    cell: ({ row }) => row.original.phone ?? "—",
  }),
  columnHelper.display({
    id: "orders",
    header: () => "Orders",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original._count.orders}</Badge>
    ),
  }),
  columnHelper.accessor("createdAt", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => formatDate({ date: row.original.createdAt }),
  }),
  columnHelper.display({
    id: "actions",
    cell: ({ row }) => <CustomersActions data={row.original} />,
    enableHiding: false,
  }),
]);
