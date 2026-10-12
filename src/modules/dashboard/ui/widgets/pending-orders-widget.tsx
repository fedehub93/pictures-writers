"use client";

import Link from "next/link";
import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";

import { WidgetList } from "../components/widget-list";

const formatAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat("it-IT", { style: "currency", currency }).format(amount);

export const PendingOrdersWidget = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.dashboard.getPendingOrders.queryOptions(),
  );

  return (
    <WidgetList
      count={data.count}
      isEmpty={data.items.length === 0}
      emptyMessage="Nessun ordine da completare."
      href="/admin/shop/orders?status=PENDING"
      linkLabel="Vedi gli ordini"
    >
      {data.items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3">
          <Link
            href={`/admin/shop/orders/${item.id}`}
            className="truncate text-sm hover:underline"
          >
            {item.orderNumber}
          </Link>
          <span className="shrink-0 text-xs font-medium">
            {formatAmount(item.totalAmount, item.currency)}
          </span>
        </li>
      ))}
    </WidgetList>
  );
};
