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

import { formatDate } from "@/lib/format";

import { useSuspenseCustomer } from "../../hooks/use-customers";

import { CustomerOrdersTable } from "../components/customer-orders-table";

interface CustomerIdViewProps {
  customerId: string;
}

const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-xs font-medium uppercase text-muted-foreground">
      {label}
    </dt>
    <dd className="text-sm">{value}</dd>
  </div>
);

export const CustomerIdView = ({ customerId }: CustomerIdViewProps) => {
  const { data: customer } = useSuspenseCustomer(customerId);

  return (
    <div className="h-full w-full flex flex-col gap-y-4 px-6 py-3">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/shop/customers">
            <ArrowLeftIcon />
            <span className="sr-only">Back to customers</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl">{customer.name ?? customer.email}</h1>
          <p className="text-sm text-muted-foreground">{customer.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Contact and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Email" value={customer.email} />
            <DetailRow label="Name" value={customer.name ?? "—"} />
            <DetailRow label="Phone" value={customer.phone ?? "—"} />
            <DetailRow label="Notes" value={customer.notes ?? "—"} />
            <DetailRow
              label="Customer since"
              value={formatDate({ date: customer.createdAt })}
            />
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {customer.orders.length} order
            {customer.orders.length === 1 ? "" : "s"} associated with this
            customer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CustomerOrdersTable orders={customer.orders} />
        </CardContent>
      </Card>
    </div>
  );
};

export const CustomerIdViewLoading = () => {
  return (
    <LoadingState
      title="Loading Customer"
      description="This may take a few seconds"
    />
  );
};

export const CustomerIdViewError = () => {
  return <ErrorState title="Error Customer" description="Something went wrong" />;
};
