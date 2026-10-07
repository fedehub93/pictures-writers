"use client";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenProduct } from "../../../hooks/use-open-product";

import { ProductForm } from "./product-form";

export const ProductDialog = () => {
  const { isOpen, onClose } = useOpenProduct();

  return (
    <ResponsiveDialog
      title="Create product"
      description="Choose a type, then finish setting up the product."
      open={isOpen}
      onOpenChange={onClose}
    >
      <ProductForm onSuccess={() => onClose()} onCancel={() => onClose()} />
    </ResponsiveDialog>
  );
};
