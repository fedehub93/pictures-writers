"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSuspenseQuery } from "@tanstack/react-query";

import { OrderStatus } from "@/generated/prisma";
import { useTRPC } from "@/trpc/client";
import { cn, getFirstCharUppercase } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import type { WidgetComponentProps } from "@/shared/dashboard/types";
import { WidgetPerson } from "@/shared/dashboard/ui/widget-person";
import {
  WidgetTable,
  WidgetTableSkeleton,
  type WidgetTableColumn,
} from "@/shared/dashboard/ui/widget-table";

import { DASHBOARD_LIST_LIMIT } from "../constants";

interface OrderRow {
  id: string;
  orderNumber: string;
  totalAmount: number;
  currency: string;
  customerName: string;
  status: OrderStatus;
}

const ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.PENDING,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

const resolveStatuses = (value: unknown): OrderStatus[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const statuses = value.filter((item): item is OrderStatus =>
    ORDER_STATUSES.includes(item as OrderStatus),
  );

  return statuses.length > 0 ? statuses : undefined;
};

const StatusBadge = ({ status }: { status: OrderStatus }) => (
  <Badge
    className={cn(
      status === OrderStatus.DRAFT && "bg-slate-700",
      status === OrderStatus.PENDING && "bg-amber-600",
      status === OrderStatus.COMPLETED && "bg-emerald-700",
      status === OrderStatus.CANCELLED && "bg-rose-700",
    )}
  >
    {getFirstCharUppercase(status.toLowerCase())}
  </Badge>
);

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(amount);

const columns: WidgetTableColumn<OrderRow>[] = [
  {
    id: "orderNumber",
    header: "Order #",
    cell: (row) => (
      <Link
        href={`/admin/shop/orders/${row.id}`}
        className="font-medium hover:underline"
      >
        {row.orderNumber}
      </Link>
    ),
  },
  {
    id: "customer",
    header: "Customer",
    grow: true,
    skeleton: "person",
    cell: (row) => <WidgetPerson name={row.customerName} />,
  },
  {
    id: "totalAmount",
    header: "Total",
    align: "right",
    cell: (row) => (
      <span className="tabular-nums">
        {formatAmount(row.totalAmount, row.currency)}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    align: "right",
    skeleton: "badge",
    cell: (row) => <StatusBadge status={row.status} />,
  },
];

export const OrdersWidget = ({ instance }: WidgetComponentProps) => {
  const trpc = useTRPC();
  const statuses = resolveStatuses(instance.config?.statuses);
  const { data } = useSuspenseQuery(
    trpc.orders.getSummary.queryOptions({ statuses }),
  );

  // The admin orders list reads one `status` at a time, so the footer only
  // carries a filter when a single status is selected.
  const href =
    statuses && statuses.length === 1
      ? (`/admin/shop/orders?status=${statuses[0]}` as Route)
      : "/admin/shop/orders";

  return (
    <WidgetTable
      columns={columns}
      rows={data.items}
      rowKey={(row) => row.id}
      rowHref={(row) => `/admin/shop/orders/${row.id}` as Route}
      count={data.count}
      href={href}
      linkLabel="View orders"
      emptyMessage="No orders."
    />
  );
};

export const OrdersWidgetSkeleton = () => (
  <WidgetTableSkeleton
    columns={columns}
    rows={DASHBOARD_LIST_LIMIT}
    href="/admin/shop/orders"
    linkLabel="View orders"
  />
);
