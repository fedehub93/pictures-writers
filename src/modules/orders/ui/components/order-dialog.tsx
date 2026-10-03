"use client";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenOrder } from "../../hooks/use-open-order";

import { OrderForm } from "./order-form";

export const OrderDialog = () => {
  const { isOpen, onClose } = useOpenOrder();

  return (
    <ResponsiveDialog
      title="New order"
      description="Create an order for a customer and add products from the catalog."
      open={isOpen}
      onOpenChange={onClose}
      contentClassName="lg:max-w-3xl"
    >
      <OrderForm onSuccess={onClose} onCancel={onClose} />
    </ResponsiveDialog>
  );
};
