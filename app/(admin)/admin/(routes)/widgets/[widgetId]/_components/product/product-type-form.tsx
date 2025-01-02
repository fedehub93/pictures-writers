"use client";

import * as z from "zod";
import Image from "next/image";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { Control, useController } from "react-hook-form";
import { widgetFormSchema } from "../widget-form";
import { Grip, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModal } from "@/app/(admin)/_hooks/use-modal-store";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductWithImageCoverAndAuthor, WidgetProductType } from "@/types";
import { Product } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { ChangeEvent } from "react";

interface ProductTypeFormProps {
  control: Control<z.infer<typeof widgetFormSchema>>;
  isSubmitting: boolean;
  isDisabled: boolean;
}

type WidgetProductFormType = {
  type: WidgetProductType;
  label: string;
};

const types: WidgetProductFormType[] = [
  {
    type: WidgetProductType.ALL,
    label: "All",
  },
  {
    type: WidgetProductType.SPECIFIC,
    label: "Specific",
  },
];

export const ProductTypeForm = ({
  control,
  isSubmitting,
  isDisabled = true,
}: ProductTypeFormProps) => {
  const { onOpen } = useModal();

  const { field: fieldProducts } = useController({
    control,
    name: "metadata.products",
  });

  const { field: fieldProductType } = useController({
    control,
    name: "metadata.productType",
  });

  const { field: fieldLimit } = useController({
    control,
    name: "metadata.limit",
  });

  const fetchProducts = async (ids: string[]) => {
    const { data } = await axios.post<ProductWithImageCoverAndAuthor[]>(
      "/api/admin/products/fetch",
      { ids }
    );
    return data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["productsFetch", fieldProducts.value.length],
    queryFn: () => fetchProducts(fieldProducts.value.map((v) => v.rootId)),
    enabled: fieldProducts.value.length > 0,
  });

  if (isLoading) return <div>Loading...</div>;

  if (isError) return <div>Error...</div>;

  const onLimitChange = (e: ChangeEvent<HTMLInputElement>) => {
    fieldLimit.onChange(Number.parseInt(e.target.value));
  };

  const onAddProduct = () => {
    onOpen("selectProduct", onSelectProduct);
  };

  const onSelectProduct = (product: Product) => {
    fieldProducts.onChange([
      ...fieldProducts.value,
      { rootId: product.rootId, sort: fieldProducts.value.length },
    ]);
  };

  const onDeleteProduct = (rootId: string) => {
    const newProducts = fieldProducts.value.filter((v) => v.rootId !== rootId);
    fieldProducts.onChange(newProducts);
  };

  const onDragEnd = (result: any) => {
    if (!result.destination) return;

    const reordered = [...fieldProducts.value];
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);

    // Aggiorna l'ordine basato sull'indice attuale
    const updatedOrder = reordered.map((item, index) => ({
      ...item,
      sort: index + 1,
    }));

    fieldProducts.onChange(updatedOrder);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-x-4 items-center">
        <FormField
          control={control}
          name="metadata.productType"
          render={({ field }) => (
            <FormItem
              className={cn(
                "w-full",
                field.value !== WidgetProductType.SPECIFIC &&
                  "flex-1 flex flex-col w-4/5"
              )}
            >
              <FormLabel className="block">Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a product type..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {types?.map((type) => (
                    <SelectItem key={type.type} value={type.type}>
                      <div className="flex gap-x-4 items-center">
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="metadata.limit"
          render={({ field }) => (
            <FormItem
              className={cn(
                "hidden",
                fieldProductType.value !== WidgetProductType.SPECIFIC &&
                  "flex flex-col w-1/5"
              )}
            >
              <FormLabel className="block">Limit</FormLabel>
              <Input
                {...field}
                onChange={onLimitChange}
                type="number"
                disabled={isSubmitting}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div
        className={cn("flex flex-col", fieldProducts.value.length && "gap-y-4")}
      >
        <FormField
          control={control}
          name="metadata.products"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Products</FormLabel>
              <FormControl>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="products" direction="vertical">
                    {(provided) => (
                      <div
                        className={cn(
                          "w-full border rounded-md p-4",
                          fieldProducts.value.length === 0 && "hidden"
                        )}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {data &&
                          fieldProducts.value.map((v, index) => {
                            const p = data.find((d) => d.rootId === v.rootId);
                            if (!p) return null;
                            return (
                              <Draggable
                                key={p.title}
                                draggableId={p.title}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    key={p.title}
                                    className="flex items-center gap-y-2 w-full border hover:shadow-xl duration-500 transition-all rounded-md shadow-md mb-4"
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                  >
                                    <div
                                      className="h-16 w-8 border-r bg-muted flex justify-center items-center cursor-pointer"
                                      {...provided.dragHandleProps}
                                    >
                                      <Grip className="h-5 w-5" />
                                    </div>
                                    <div className="text-sm px-2 line-clamp-2">
                                      {p.title}
                                    </div>
                                    <div className="flex ml-auto group">
                                      <div className="relative w-16 h-16 aspect-square overflow-hidden">
                                        <Image
                                          src={p.imageCover?.url || ""}
                                          alt={"image"}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <div
                                        className="h-16 w-0 border-r bg-destructive flex justify-center items-center cursor-pointer group-hover:w-8 transition-all duration-500"
                                        onClick={() =>
                                          onDeleteProduct(p.rootId!)
                                        }
                                      >
                                        <Trash2 className="h-5 w-5 text-white" />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={onAddProduct}
          disabled={isSubmitting || isDisabled}
        >
          Add a product
        </Button>
      </div>
    </div>
  );
};
