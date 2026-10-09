"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useDebounceValue } from "usehooks-ts";

import { useTRPC } from "@/trpc/client";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";

import { Button } from "@/shared/ui/button";
import { Checkbox } from "@/shared/ui/checkbox";

import { GenericInput } from "@/shared/components/form-component/generic-input";
import { GenericTextarea } from "@/shared/components/form-component/generic-textarea";
import { GenericCalendar } from "@/shared/components/form-component/generic-calendar";
import { CommandSelect } from "@/shared/components/command-select";

import { reviewInsertSchema, type ReviewInsertValues } from "../../../schemas";
import { useProductOptions } from "../../../hooks/use-product-options";
import { useReviewsFilters } from "../../../hooks/use-reviews-filters";
import { RatingStars } from "./rating-stars";

interface ReviewFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: {
    id?: string;
    reviewerName?: string | null;
    role?: string | null;
    rating?: number;
    comment?: string | null;
    date?: Date;
    productId?: string;
    verifiedPurchase?: boolean;
  };
}

export const ReviewForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: ReviewFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useReviewsFilters();

  const [productSearch, setProductSearch] = useDebounceValue("", 500);
  const { data } = useProductOptions(productSearch);

  const form = useForm<ReviewInsertValues>({
    resolver: zodResolver(reviewInsertSchema),
    values: {
      reviewerName: initialValues?.reviewerName ?? "",
      role: initialValues?.role ?? "",
      rating: initialValues?.rating ?? 5,
      comment: initialValues?.comment ?? "",
      date: initialValues?.date ?? new Date(),
      productId: initialValues?.productId ?? "",
      verifiedPurchase: initialValues?.verifiedPurchase ?? false,
    },
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries(
      trpc.reviews.getMany.queryFilter(filters),
    );
  };

  const createReview = useMutation(
    trpc.reviews.create.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Review created successfully");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const updateReview = useMutation(
    trpc.reviews.update.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        toast.success("Review updated successfully");
        onSuccess?.();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isEdit = !!initialValues?.id;
  const isPending = createReview.isPending || updateReview.isPending;

  const onSubmit = (values: ReviewInsertValues) => {
    if (isEdit) {
      updateReview.mutate({ ...values, id: initialValues.id! });
    } else {
      createReview.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          name="productId"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Product</FormLabel>
              <FormControl>
                <CommandSelect
                  options={(data?.items || []).map((product) => ({
                    id: product.rootId,
                    value: product.rootId,
                    children: (
                      <div className="flex items-center gap-x-2 w-full max-w-full relative">
                        {product.imageCover && (
                          <Image
                            src={product.imageCover.url}
                            alt={product.imageCover.altText ?? ""}
                            width={50}
                            height={50}
                            className="object-contain size-6 bg-muted-foreground/50 rounded"
                          />
                        )}
                        {!product.imageCover && (
                          <div className="text-xs flex items-center justify-center size-6 bg-muted-foreground/50 rounded text-muted-foreground">
                            N/I
                          </div>
                        )}
                        <span className="text-xs truncate max-w-70 md:text-base md:max-w-full">
                          {product.title}
                        </span>
                      </div>
                    ),
                  }))}
                  onSelect={field.onChange}
                  onSearch={setProductSearch}
                  value={field.value}
                  placeholder="Select a product"
                  disabled={isPending}
                />
              </FormControl>

              <FormMessage />
            </FormItem>
          )}
        />
        <GenericInput
          control={form.control}
          name="reviewerName"
          label="Reviewer Name"
          placeholder="John Doe"
          disabled={isPending}
        />
        <GenericInput
          control={form.control}
          name="role"
          label="Role"
          placeholder="Aspirante sceneggiatore"
          disabled={isPending}
        />
        <FormField
          name="rating"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-4">
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <RatingStars
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <GenericTextarea
          control={form.control}
          name="comment"
          label="Comment"
          disabled={isPending}
        />
        <GenericCalendar
          control={form.control}
          name="date"
          label="Date"
          onlyFutureDates={false}
          disabled={isPending}
        />
        <FormField
          control={form.control}
          name="verifiedPurchase"
          render={({ field }) => (
            <FormItem className="flex items-center gap-x-4 mt-8">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                  disabled={isPending}
                  className="size-5 accent-primary mb-0"
                />
              </FormControl>
              <FormLabel>Verified Purchase</FormLabel>
            </FormItem>
          )}
        />

        <div className="flex justify-between gap-x-2 mt-8">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button disabled={isPending} type="submit">
            {isEdit ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
