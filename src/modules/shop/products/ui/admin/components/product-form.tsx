"use client";

import { useRouter } from "next/navigation";
import { useController, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BookText,
  ClipboardPen,
  ExternalLink,
  Headset,
} from "lucide-react";
import { toast } from "sonner";

import { ProductType } from "@/generated/prisma";

import { useTRPC } from "@/trpc/client";

import { Form, FormField, FormControl, FormItem, FormLabel } from "@/shared/ui/form";
import { Button } from "@/shared/ui/button";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import { generateSlug } from "@/shared/lib/slug";
import { GenericInput } from "@/shared/components/form-component/generic-input";
import { SlugInput } from "@/shared/components/form-component/slug-input";

import {
  productInsertSchema,
  type ProductInsertValues,
} from "../../../schemas";
import { useProductsFilters } from "../../../hooks/use-products-filters";

const types = [
  { type: ProductType.EBOOK, label: "Ebook", Icon: BookText },
  { type: ProductType.SERVICE, label: "Service", Icon: ClipboardPen },
  { type: ProductType.AFFILIATE, label: "Affiliate", Icon: ExternalLink },
  { type: ProductType.WEBINAR, label: "Webinar", Icon: Headset },
];

interface ProductFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ProductForm = ({ onSuccess, onCancel }: ProductFormProps) => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filters] = useProductsFilters();

  const form = useForm<ProductInsertValues>({
    resolver: zodResolver(productInsertSchema),
    defaultValues: {
      title: "",
      slug: "",
      type: ProductType.EBOOK,
    },
  });

  const createProduct = useMutation(
    trpc.products.create.mutationOptions({
      onSuccess: async (product) => {
        await queryClient.invalidateQueries(
          trpc.products.getMany.queryFilter(filters),
        );
        toast.success("Product created successfully");
        onSuccess?.();
        router.push(`/admin/shop/products/${product.rootId ?? product.id}`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const isPending = createProduct.isPending;

  const onSubmit = (values: ProductInsertValues) => {
    createProduct.mutate(values);
  };

  const { field: fieldTitle } = useController({
    control: form.control,
    name: "title",
  });

  return (
    <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GenericInput
          control={form.control}
          name="title"
          label="Title"
          placeholder="Ebook Screenplay 101"
          disabled={isPending}
        />
        <SlugInput
          control={form.control}
          name="slug"
          label="Slug"
          placeholder="screenplay-101"
          disabled={isPending}
          buttonOnClick={() =>
            form.setValue("slug", generateSlug(fieldTitle.value))
          }
        />
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-4"
                >
                  {types.map((type) => (
                    <FormItem key={type.type}>
                      <div>
                        <FormControl>
                          <RadioGroupItem
                            value={type.type}
                            id={type.type}
                            className="peer sr-only"
                          />
                        </FormControl>
                        <FormLabel
                          htmlFor={type.type}
                          className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                        >
                          <type.Icon className="w-6 h-6 mb-3" />
                          {type.label}
                        </FormLabel>
                      </div>
                    </FormItem>
                  ))}
                </RadioGroup>
              </FormControl>
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
            Create
          </Button>
        </div>
      </form>
    </Form>
  );
};
