"use client";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenProductCategory } from "../../../hooks/use-open-product-category";

import { ProductCategoryForm } from "./product-category-form";

export const ProductCategoryDialog = () => {
  const { isOpen, onClose } = useOpenProductCategory();

  return (
    <ResponsiveDialog
      title="Create category"
      description="Create a product category, then fill in the details."
      open={isOpen}
      onOpenChange={onClose}
    >
      <ProductCategoryForm
        onSuccess={() => onClose()}
        onCancel={() => onClose()}
      />
    </ResponsiveDialog>
  );
};
