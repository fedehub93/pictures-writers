"use client";

import Link from "next/link";
import { createColumnHelper } from "@tanstack/react-table";

import { DataTableColumnHeader } from "@/shared/components/data-table-column-header";
import { Badge } from "@/shared/ui/badge";
import { formatDate, formatPrice } from "@/lib/format";

import { OrdersGetMany } from "../../types";

import { OrdersActions } from "./actions";
import { OrderStatusBadge } from "./order-status-badge";
import { type DataTableFeatures } from "./data-table-features";

type Order = OrdersGetMany["items"][number];

const columnHelper = createColumnHelper<DataTableFeatures, Order>();

export const columns = columnHelper.columns([
  columnHelper.accessor("orderNumber", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order" />
    ),
    sortFn: "text",
    cell: ({ row }) => (
      <Link
        href={`/admin/shop/orders/${row.original.id}`}
        className="font-medium hover:underline"
      >
        {row.original.orderNumber}
      </Link>
    ),
  }),
  columnHelper.display({
    id: "customer",
    header: () => "Customer",
    cell: ({ row }) => (
      <div className="flex flex-col">
        <span className="text-sm">{row.original.customer.name ?? "—"}</span>
        <span className="text-xs text-muted-foreground">
          {row.original.customer.email}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("orderDate", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order date" />
    ),
    sortFn: "datetime",
    cell: ({ row }) => formatDate({ date: row.original.orderDate }),
  }),
  columnHelper.accessor("status", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    sortFn: "text",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  }),
  columnHelper.display({
    id: "items",
    header: () => "Items",
    cell: ({ row }) => (
      <Badge variant="secondary">{row.original._count.items}</Badge>
    ),
  }),
  columnHelper.accessor("totalAmount", {
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    sortFn: "basic",
    cell: ({ row }) => formatPrice(row.original.totalAmount),
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
    cell: ({ row }) => <OrdersActions data={row.original} />,
    enableHiding: false,
  }),
]);
