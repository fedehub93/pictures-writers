"use client";

import Link from "next/link";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui/table";
import { formatPrice } from "@/lib/format";

import { OrderGetOne } from "../../types";

type OrderItem = OrderGetOne["items"][number];

export const OrderItemsTable = ({ items }: { items: OrderItem[] }) => {
  if (items.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border text-sm text-muted-foreground">
        This order has no line items yet.
      </div>
    );
  }

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Unit price</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                {item.productId ? (
                  <Link
                    href={`/admin/shop/products/${item.productId}`}
                    className="hover:underline"
                  >
                    {item.nameSnapshot}
                  </Link>
                ) : (
                  item.nameSnapshot
                )}
              </TableCell>
              <TableCell>{formatPrice(item.unitPrice, true)}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell className="text-right">
                {formatPrice(item.totalPrice, true)}
              </TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={3} className="text-right font-medium">
              Total
            </TableCell>
            <TableCell className="text-right font-semibold">
              {formatPrice(total, true)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
};
