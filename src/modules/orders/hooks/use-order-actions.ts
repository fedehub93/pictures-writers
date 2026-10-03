"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { OrderStatus } from "@/generated/prisma";
import { useTRPC } from "@/trpc/client";
import { usePermission } from "@/shared/providers/authorization-provider";
import { PERMISSIONS } from "@/shared/lib/permissions";

import { useOrderFilters } from "./use-orders-filter";

interface UseOrderActionsArgs {
  id: string;
  status: OrderStatus;
}

/**
 * Shared confirm/complete/cancel wiring for an order, used by both the list row
 * actions and the detail page actions.
 */
export const useOrderActions = ({ id, status }: UseOrderActionsArgs) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [filters] = useOrderFilters();

  const canUpdate = usePermission(PERMISSIONS.ORDERS_UPDATE);
  const canManage = usePermission(PERMISSIONS.ORDERS_MANAGE);

  const invalidate = async () => {
    await queryClient.invalidateQueries(
      trpc.orders.getMany.queryOptions(filters),
    );
    await queryClient.invalidateQueries(
      trpc.orders.getOne.queryOptions({ id }),
    );
    router.refresh();
  };

  const confirmOrder = useMutation(
    trpc.orders.confirm.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Order confirmed.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const completeOrder = useMutation(
    trpc.orders.complete.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Order completed.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const cancelOrder = useMutation(
    trpc.orders.cancel.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Order cancelled.");
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const isPending =
    confirmOrder.isPending || completeOrder.isPending || cancelOrder.isPending;

  const canConfirm = status === OrderStatus.DRAFT && canUpdate;
  const canComplete = status === OrderStatus.PENDING && canManage;
  const canCancel =
    (status === OrderStatus.DRAFT || status === OrderStatus.PENDING) &&
    canManage;

  return {
    confirmOrder,
    completeOrder,
    cancelOrder,
    isPending,
    canConfirm,
    canComplete,
    canCancel,
  };
};
