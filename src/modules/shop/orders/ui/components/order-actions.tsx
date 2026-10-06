"use client";

import { CheckCircle2Icon, SendIcon, XCircleIcon } from "lucide-react";

import { Button } from "@/shared/ui/button";

import { ConfirmModal } from "@/app/(admin)/_components/modals/confirm-modal";

import { useOrderActions } from "../../hooks/use-order-actions";
import { OrderGetOne } from "../../types";

export const OrderActions = ({ order }: { order: OrderGetOne }) => {
  const {
    confirmOrder,
    completeOrder,
    cancelOrder,
    isPending,
    canConfirm,
    canComplete,
    canCancel,
  } = useOrderActions({ id: order.id, status: order.status });

  if (!canConfirm && !canComplete && !canCancel) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {canConfirm && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => confirmOrder.mutate({ id: order.id })}
        >
          <SendIcon data-icon="inline-start" />
          Confirm
        </Button>
      )}
      {canComplete && (
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => completeOrder.mutate({ id: order.id })}
        >
          <CheckCircle2Icon data-icon="inline-start" />
          Complete
        </Button>
      )}
      {canCancel && (
        <ConfirmModal onConfirm={() => cancelOrder.mutate({ id: order.id })}>
          <Button variant="destructive" size="sm" disabled={isPending}>
            <XCircleIcon data-icon="inline-start" />
            Cancel order
          </Button>
        </ConfirmModal>
      )}
    </div>
  );
};
