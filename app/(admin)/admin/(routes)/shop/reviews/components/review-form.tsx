"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useDebounceValue } from "usehooks-ts";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Button } from "@/components/ui/button";

import { GenericInput } from "@/components/form-component/generic-input";
import { GenericTextarea } from "@/components/form-component/generic-textarea";
import { GenericCalendar } from "@/components/form-component/generic-calendar";
import { CommandSelect } from "@/components/command-select";

import { reviewsInsertSchema, reviewsUpdateSchema } from "../schema";
import { RatingStars } from "./rating-stars";
import { useGetProducts } from "../hooks/use-get-products";

interface ReviewFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: {
    id: string;
    reviewerName: string;
    rating: number;
    comment: string;
    date: Date;
    productId: string;
  };
}

export const ReviewForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: ReviewFormProps) => {
  const queryClient = useQueryClient();
  const router = useRouter();

  const [productSearch, setProductSearch] = useDebounceValue("", 500);
  const { data } = useGetProducts(productSearch);

  const form = useForm<z.infer<typeof reviewsInsertSchema>>({
    resolver: zodResolver(reviewsInsertSchema),
    defaultValues: {
      reviewerName: initialValues?.reviewerName ?? "",
      rating: initialValues?.rating ?? 5,
      comment: initialValues?.comment ?? "",
      date: initialValues?.date ?? new Date(),
      productId: initialValues?.productId ?? "",
    },
  });

  const updateReview = useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & z.infer<typeof reviewsUpdateSchema>) => {
      return axios.patch(`/api/admin/shop/reviews/${id}`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["reviews"],
      });

      if (initialValues?.id) {
        await queryClient.invalidateQueries({
          queryKey: ["review", { id: initialValues.id }],
        });
      }

      toast.success("Review updated successfully");
      router.refresh();
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update review");
    },
  });

  const createReview = useMutation({
    mutationFn: (payload: z.infer<typeof reviewsInsertSchema>) => {
      return axios.post(`/api/admin/shop/reviews`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["reviews"] });

      router.refresh();
      toast.success("Review created successfully");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to create review");
    },
  });

  const isEdit = !!initialValues?.id;
  const isPending = updateReview.isPending;

  const onSubmit = (values: z.infer<typeof reviewsInsertSchema>) => {
    if (isEdit) {
      updateReview.mutate({ ...values, id: initialValues.id });
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
                    id: product.id,
                    value: product.id,
                    children: (
                      <div className="flex items-center gap-x-2">
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
                        <span>{product.title}</span>
                      </div>
                    ),
                  }))}
                  onSelect={field.onChange}
                  onSearch={setProductSearch}
                  value={field.value}
                  placeholder="Select a product"
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
        <FormField
          name="rating"
          control={form.control}
          render={({ field }) => (
            <FormItem className="flex flex-col space-y-4">
              <FormLabel>Rating</FormLabel>
              <FormControl>
                <RatingStars value={field.value} onChange={field.onChange} />
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
          name={`date`}
          label="Date"
          onlyFutureDates={false}
          disabled={isPending}
        />

        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              disabled={isPending}
              type="button"
              onClick={onCancel}
            >
              Cancel
              <FormMessage />
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
