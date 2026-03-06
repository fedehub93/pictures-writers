import { Loader2Icon } from "lucide-react";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ResponsiveDialog } from "@/components/responsive-dialog";
import { useOpenReview } from "../hooks/use-open-review";
import { useGetReview } from "../hooks/use-get-review";
import { ReviewForm } from "./review-form";

export const UpdateReviewDialog = () => {
  const { isOpen, onClose, id } = useOpenReview();
  const queryClient = useQueryClient();
  const { data, isLoading } = useGetReview(id);

  useEffect(() => {
    if (isOpen && id) {
      queryClient.invalidateQueries({ queryKey: ["review", { id }] });
    }
  }, [isOpen, id, queryClient]);

  return (
    <ResponsiveDialog
      title="Edit Review"
      description="Edit the review details"
      open={isOpen}
      onOpenChange={onClose}
    >
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2Icon className="size-4 text-muted-foreground animate-spin" />
        </div>
      ) : (
        <ReviewForm
          onSuccess={() => onClose()}
          onCancel={() => onClose()}
          initialValues={{
            id: data?.id,
            reviewerName: data?.reviewerName ?? "",
            rating: data?.rating ?? 0,
            comment: data?.comment ?? "",
            date: data?.date,
            productId: data?.productId ?? "",
          }}
        />
      )}
    </ResponsiveDialog>
  );
};
