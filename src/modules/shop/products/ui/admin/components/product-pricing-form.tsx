"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import * as z from "zod";

import { ProductAcquisitionMode } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";

import { Form } from "@/shared/ui/form";
import { Field, FieldLabel } from "@/shared/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Switch } from "@/shared/ui/switch";

import { GenericMoneyInput } from "@/shared/components/form-component/generic-money-input";

import { useAutoSave } from "@/modules/blog/shared/hooks/use-auto-save";

import { productUpdateSchema } from "../../../schemas";
import { useProductsFilters } from "../../../hooks/use-products-filters";

const formSchema = productUpdateSchema.pick({
  id: true,
  rootId: true,
  acquisitionMode: true,
  price: true,
  discountedPrice: true,
  isFree: true,
});

type FormValues = z.infer<typeof formSchema>;

const ACQUISITION_MODES = [
  ProductAcquisitionMode.FREE,
  ProductAcquisitionMode.PAID,
  ProductAcquisitionMode.FORM,
  ProductAcquisitionMode.AFFILIATE,
];

interface ProductPricingFormProps {
  id: string;
  rootId: string;
  initialData: {
    acquisitionMode: ProductAcquisitionMode;
    price: number | null;
    discountedPrice: number | null;
    isFree: boolean;
  };
}

export const ProductPricingForm = ({
  id,
  rootId,
  initialData,
}: ProductPricingFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useProductsFilters();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    values: {
      id,
      rootId,
      acquisitionMode: initialData.acquisitionMode,
      price: initialData.price ?? 0,
      discountedPrice: initialData.discountedPrice ?? 0,
      isFree: initialData.isFree,
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
        toast.success("Pricing updated successfully");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update the pricing");
      },
    }),
  );

  const handleAutoSave = useAutoSave(form, (dirtyData) => {
    updateProduct({ id, rootId, ...dirtyData });
  });

  return (
    <Form {...form}>
      <form onChange={handleAutoSave} className="p-2 flex flex-col gap-y-4">
        <Controller
          control={form.control}
          name="acquisitionMode"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <div className="flex flex-col gap-y-2">
                <FieldLabel htmlFor="form-rhf-acquisition-mode">
                  Acquisition Mode
                </FieldLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleAutoSave();
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger
                    id="form-rhf-acquisition-mode"
                    className="w-full capitalize mb-0"
                  >
                    <SelectValue placeholder="Select a mode..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ACQUISITION_MODES.map((mode) => (
                      <SelectItem key={mode} value={mode} className="capitalize">
                        {mode.toLowerCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </Field>
          )}
        />
        <GenericMoneyInput
          control={form.control}
          name="price"
          label="Price"
          placeholder="Set a price for your product"
          disabled={isPending}
        />
        <GenericMoneyInput
          control={form.control}
          name="discountedPrice"
          label="Discounted price"
          placeholder="Set a discounted price for your product"
          disabled={isPending}
        />
        <Controller
          control={form.control}
          name="isFree"
          render={({ field }) => (
            <Field className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FieldLabel htmlFor="form-rhf-is-free">Free</FieldLabel>
                <p className="text-sm text-muted-foreground">
                  Make this product available at no cost.
                </p>
              </div>
              <Switch
                id="form-rhf-is-free"
                checked={field.value ?? false}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  handleAutoSave();
                }}
                disabled={isPending}
              />
            </Field>
          )}
        />
      </form>
    </Form>
  );
};
