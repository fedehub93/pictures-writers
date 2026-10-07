import { OrderStatus } from "@/generated/prisma";
import { Badge } from "@/shared/ui/badge";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: "Draft",
  [OrderStatus.PENDING]: "Pending",
  [OrderStatus.COMPLETED]: "Completed",
  [OrderStatus.CANCELLED]: "Cancelled",
};

const ORDER_STATUS_VARIANTS: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [OrderStatus.DRAFT]: "outline",
  [OrderStatus.PENDING]: "secondary",
  [OrderStatus.COMPLETED]: "default",
  [OrderStatus.CANCELLED]: "destructive",
};

export const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  return (
    <Badge variant={ORDER_STATUS_VARIANTS[status]}>
      {ORDER_STATUS_LABELS[status]}
    </Badge>
  );
};
