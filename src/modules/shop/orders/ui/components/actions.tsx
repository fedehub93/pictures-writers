"use client";

import Link from "next/link";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  MoreHorizontalIcon,
  SendIcon,
  XCircleIcon,
} from "lucide-react";

import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useOrderActions } from "../../hooks/use-order-actions";
import { OrdersGetMany } from "../../types";

type Order = OrdersGetMany["items"][number];

interface OrdersActionsProps {
  data: Order;
}

export const OrdersActions = ({ data }: OrdersActionsProps) => {
  const {
    confirmOrder,
    completeOrder,
    cancelOrder,
    isPending,
    canConfirm,
    canComplete,
    canCancel,
  } = useOrderActions({ id: data.id, status: data.status });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <span className="sr-only">Open menu</span>
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/admin/shop/orders/${data.id}`}>
            <ExternalLinkIcon />
            View
          </Link>
        </DropdownMenuItem>
        {canConfirm && (
          <DropdownMenuItem
            disabled={isPending}
            onClick={() => confirmOrder.mutate({ id: data.id })}
          >
            <SendIcon />
            Confirm
          </DropdownMenuItem>
        )}
        {canComplete && (
          <DropdownMenuItem
            disabled={isPending}
            onClick={() => completeOrder.mutate({ id: data.id })}
          >
            <CheckCircle2Icon />
            Complete
          </DropdownMenuItem>
        )}
        {canCancel && (
          <>
            <DropdownMenuSeparator />
            <ConfirmModal
              onConfirm={() => cancelOrder.mutate({ id: data.id })}
            >
              <Button
                variant="ghost"
                disabled={isPending}
                className="w-full justify-start"
              >
                <XCircleIcon data-icon="inline-start" />
                Cancel order
              </Button>
            </ConfirmModal>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
