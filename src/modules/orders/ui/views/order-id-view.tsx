"use client";

import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

import { LoadingState } from "@/shared/components/loading-state";
import { ErrorState } from "@/shared/components/error-state";

import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

import { formatDate, formatPrice } from "@/lib/format";

import { useSuspenseOrder } from "../../hooks/use-orders";

import { OrderActions } from "../components/order-actions";
import { OrderItemsTable } from "../components/order-items-table";
import { OrderPaymentsTable } from "../components/order-payments-table";
import { OrderStatusBadge } from "../components/order-status-badge";

interface OrderIdViewProps {
  orderId: string;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs font-medium uppercase text-muted-foreground">
      {label}
    </dt>
    <dd className="text-sm">{value}</dd>
  </div>
);

export const OrderIdView = ({ orderId }: OrderIdViewProps) => {
  const { data: order } = useSuspenseOrder(orderId);

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/shop/orders">
            <ArrowLeftIcon />
            <span className="sr-only">Back to orders</span>
          </Link>
        </Button>
        <div className="flex flex-1 items-center gap-3">
          <h1 className="text-2xl">{order.orderNumber}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <OrderActions order={order} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
          <CardDescription>The buyer this order belongs to</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow
              label="Name"
              value={order.customer.name ?? "—"}
            />
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium uppercase text-muted-foreground">
                Email
              </dt>
              <dd className="text-sm">
                <Link
                  href={`/admin/shop/customers/${order.customer.id}`}
                  className="hover:underline"
                >
                  {order.customer.email}
                </Link>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order</CardTitle>
          <CardDescription>Lifecycle and source information</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Source" value={order.source} />
            <DetailRow
              label="Total"
              value={formatPrice(order.totalAmount, true)}
            />
            <DetailRow
              label="Order date"
              value={formatDate({ date: order.orderDate })}
            />
            <DetailRow
              label="Created"
              value={formatDate({ date: order.createdAt })}
            />
            <DetailRow
              label="Completed"
              value={
                order.completedAt
                  ? formatDate({ date: order.completedAt })
                  : "—"
              }
            />
            <DetailRow label="Completed by" value={order.completedBy ?? "—"} />
            <DetailRow label="Notes" value={order.notes ?? "—"} />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Line items</CardTitle>
          <CardDescription>
            {order.items.length} item
            {order.items.length === 1 ? "" : "s"} with price snapshots
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderItemsTable items={order.items} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>Money received or expected</CardDescription>
        </CardHeader>
        <CardContent>
          <OrderPaymentsTable payments={order.payments} />
        </CardContent>
      </Card>
    </div>
  );
};

export const OrderIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Order"
      description="This may take a few seconds"
    />
  );
};

export const OrderIdViewError = () => {
  return <ErrorState title="Error Order" description="Something went wrong" />;
};
