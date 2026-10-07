"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";

import { useTRPC } from "@/trpc/client";

import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { DialogFooter } from "@/shared/ui/dialog";
import { Form } from "@/shared/ui/form";
import { ResponsiveDialog } from "@/shared/components/responsive-dialog";
import { FaqFieldArrayForm } from "@/shared/components/form-component/faq-field-array-form";

import type { FaqItem } from "@/modules/faq";

import { productUpdateSchema } from "../../../schemas";
import { useProductsFilters } from "../../../hooks/use-products-filters";

const formSchema = productUpdateSchema.pick({
  id: true,
  rootId: true,
  faqs: true,
});

type FormValues = z.infer<typeof formSchema>;

interface ProductFaqFormProps {
  id: string;
  rootId: string;
  initialData: {
    faqs: FaqItem[];
  };
}

export const ProductFaqForm = ({
  id,
  rootId,
  initialData,
}: ProductFaqFormProps) => {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductsFilters();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      faqs: initialData.faqs ?? [],
    },
    mode: "onChange",
  });

  const { mutate: updateProduct, isPending } = useMutation(
    trpc.products.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        queryClient.invalidateQueries(
          trpc.products.getLastByRootId.queryFilter({ rootId }),
        );
        toast.success("FAQ updated successfully");
        setOpen(false);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update the FAQ");
      },
    }),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset({ id, rootId, faqs: initialData.faqs ?? [] });
    }
    setOpen(nextOpen);
  };

  const handleSubmit = form.handleSubmit((values) => {
    updateProduct({ id, rootId, faqs: values.faqs ?? [] });
  });

  return (
    <Card className="rounded-xl">
      <CardHeader>
        <CardTitle className="text-base">FAQ</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initialData.faqs.length} FAQ entries on this version.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => handleOpenChange(true)}
          disabled={isPending}
        >
          Edit FAQ
        </Button>
      </CardContent>

      <ResponsiveDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Edit FAQ"
        description="Add, edit, reorder or remove questions and answers shown in the FAQ section."
      >
        <Form {...form}>
          <form id="product-faq-form" onSubmit={handleSubmit} className="space-y-4">
            <FaqFieldArrayForm
              control={form.control}
              isSubmitting={isPending}
            />
          </form>
        </Form>
        <DialogFooter className="mt-6 flex flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button form="product-faq-form" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save FAQ"}
          </Button>
        </DialogFooter>
      </ResponsiveDialog>
    </Card>
  );
};
