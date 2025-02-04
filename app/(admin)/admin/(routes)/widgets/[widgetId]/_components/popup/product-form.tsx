import * as z from "zod";
import Image from "next/image";

import { Control, useController } from "react-hook-form";
import { widgetFormSchema } from "../widget-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import axios from "axios";
import { ProductWithImageCoverAndAuthor } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Grip, Trash2 } from "lucide-react";

interface PopupProductFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
  isDisabled?: boolean;
}

export const PopupProductForm = ({
  control,
  isSubmitting,
  isDisabled = true,
}: PopupProductFormProps) => {
  const { onOpen } = useModal();

  const { field: fieldProduct } = useController({
    control,
    name: "metadata.productRootId",
  });

  const fetchProducts = async (id: string) => {
    const { data } = await axios.post<ProductWithImageCoverAndAuthor[]>(
      "/api/admin/products/fetch",
      { ids: [id] }
    );
    return data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["productsFetch", fieldProduct.value],
    queryFn: () => fetchProducts(fieldProduct.value),
    enabled: !!fieldProduct.value,
  });

  const onAddProduct = () => {
    onOpen("selectProduct", onSelectProduct);
  };

  const onSelectProduct = (product: Product) => {
    fieldProduct.onChange(product.rootId);
  };

  const onDeleteProduct = (rootId: string) => {
    fieldProduct.onChange(null);
  };

  if (isLoading) return <div>Loading...</div>;

  if (isError) return <div>Error...</div>;

  return (
    <div>
      <FormField
        control={control}
        name="metadata.product"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Product</FormLabel>
            <FormControl>
              {data && data.length > 0 && fieldProduct.value && (
                <div
                  key={data[0].title}
                  className="flex items-center gap-y-2 w-full border hover:shadow-xl duration-500 transition-all rounded-md shadow-md mb-4"
                >
                  <div className="text-sm px-2 line-clamp-2">
                    {data[0].title}
                  </div>
                  <div className="flex ml-auto group">
                    <div className="relative w-16 h-16 aspect-square overflow-hidden">
                      <Image
                        src={data[0].imageCover?.url || ""}
                        alt={"image"}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div
                      className="h-16 w-0 border-r bg-destructive flex justify-center items-center cursor-pointer group-hover:w-8 transition-all duration-500"
                      onClick={() => onDeleteProduct(data[0].rootId!)}
                    >
                      <Trash2 className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {!!fieldProduct.value === false && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onAddProduct}
          disabled={isSubmitting}
        >
          Add a product
        </Button>
      )}
    </div>
  );
};
