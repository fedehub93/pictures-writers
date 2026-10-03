"use client";

import { OrderStatus } from "@/generated/prisma";
import { Badge } from "@/shared/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatDate, formatPrice } from "@/lib/format";

import { CustomerGetOne } from "../../types";

type Order = CustomerGetOne["orders"][number];

const statusVariant = (
  status: OrderStatus,
): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case OrderStatus.COMPLETED:
      return "default";
    case OrderStatus.PENDING:
      return "secondary";
    case OrderStatus.CANCELLED:
      return "destructive";
    default:
      return "outline";
  }
};

const statusLabel = (status: OrderStatus) =>
  status.charAt(0) + status.slice(1).toLowerCase();

export const CustomerOrdersTable = ({ orders }: { orders: Order[] }) => {
  if (orders.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border text-sm text-muted-foreground">
        This customer has no orders yet.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.orderNumber}</TableCell>
              <TableCell>
                <Badge variant={statusVariant(order.status)}>
                  {statusLabel(order.status)}
                </Badge>
              </TableCell>
              <TableCell>{order.items.length}</TableCell>
              <TableCell>{formatPrice(order.totalAmount)}</TableCell>
              <TableCell>{formatDate({ date: order.createdAt })}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
