"use client";

import { PaymentStatus } from "@/generated/prisma";
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

import { OrderGetOne } from "../../types";

type Payment = OrderGetOne["payments"][number];

const STATUS_LABELS: Record<PaymentStatus, string> = {
  [PaymentStatus.PENDING]: "Pending",
  [PaymentStatus.COMPLETED]: "Completed",
  [PaymentStatus.REFUNDED]: "Refunded",
  [PaymentStatus.FAILED]: "Failed",
};

const STATUS_VARIANTS: Record<
  PaymentStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [PaymentStatus.PENDING]: "secondary",
  [PaymentStatus.COMPLETED]: "default",
  [PaymentStatus.REFUNDED]: "outline",
  [PaymentStatus.FAILED]: "destructive",
};

export const OrderPaymentsTable = ({
  payments,
}: {
  payments: Payment[];
}) => {
  if (payments.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-md border text-sm text-muted-foreground">
        No payments recorded for this order.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid at</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">{payment.method}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANTS[payment.status]}>
                  {STATUS_LABELS[payment.status]}
                </Badge>
              </TableCell>
              <TableCell>{formatPrice(payment.amount, true)}</TableCell>
              <TableCell>
                {payment.paidAt
                  ? formatDate({ date: payment.paidAt })
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
