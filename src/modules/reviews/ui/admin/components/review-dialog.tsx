"use client";

import { ResponsiveDialog } from "@/shared/components/responsive-dialog";

import { useOpenReview } from "../../../hooks/use-open-review";

import { ReviewForm } from "./review-form";

export const ReviewDialog = () => {
  const { isOpen, onClose, data } = useOpenReview();

  return (
    <ResponsiveDialog
      title={data ? "Edit review" : "New review"}
      description="Manage the review details shown publicly once published."
      open={isOpen}
      onOpenChange={onClose}
    >
      <ReviewForm
        onSuccess={onClose}
        onCancel={onClose}
        initialValues={
          data
            ? {
                id: data.id,
                reviewerName: data.reviewerName,
                role: data.role,
                rating: data.rating,
                comment: data.comment,
                date: data.date,
                productId: data.product.id,
                verifiedPurchase: data.verifiedPurchase,
              }
            : undefined
        }
      />
    </ResponsiveDialog>
  );
};
