"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { formatPrice } from "@/lib/format";

import { GenericCalendar } from "@/shared/components/form-component/generic-calendar";
import { Button } from "@/shared/ui/button";
import { Separator } from "@/shared/ui/separator";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { orderInsertSchema, OrderInsertValues } from "../../schemas";
import { useOrderFilters } from "../../hooks/use-orders-filter";

interface OrderFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const OrderForm = ({ onSuccess, onCancel }: OrderFormProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [filters] = useOrderFilters();

  const { data: options } = useQuery(
    trpc.orders.getFormOptions.queryOptions(),
  );

  const form = useForm<OrderInsertValues>({
    resolver: zodResolver(orderInsertSchema),
    defaultValues: {
      customerId: "",
      items: [{ productId: "", quantity: 1 }],
      orderDate: new Date(),
      notes: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const createOrder = useMutation(
    trpc.orders.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(
          trpc.orders.getMany.queryOptions(filters),
        );
        toast.success("Order created successfully!");
        onSuccess?.();
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const watchedItems =
    useWatch({ control: form.control, name: "items" }) ?? [];
  const products = options?.products ?? [];
  const total = watchedItems.reduce((sum, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    const quantity = Number(item.quantity) || 0;
    return sum + (product?.price ?? 0) * quantity;
  }, 0);

  const onSubmit = (values: OrderInsertValues) => {
    createOrder.mutate(values);
  };

  const isPending = createOrder.isPending;

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Customer</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isPending}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectGroup>
                    {options?.customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name
                          ? `${customer.name} — ${customer.email}`
                          : customer.email}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <GenericCalendar
          control={form.control}
          name="orderDate"
          label="Order date"
          onlyFutureDates={false}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <FormLabel>Products</FormLabel>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => append({ productId: "", quantity: 1 })}
            >
              <PlusIcon data-icon="inline-start" />
              Add product
            </Button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <FormField
                control={form.control}
                name={`items.${index}.productId`}
                render={({ field: productField }) => (
                  <FormItem className="flex-1">
                    <Select
                      value={productField.value}
                      onValueChange={productField.onChange}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.title} —{" "}
                              {formatPrice(product.price ?? 0, true)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`items.${index}.quantity`}
                render={({ field: quantityField }) => (
                  <FormItem className="w-24">
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        disabled={isPending}
                        value={quantityField.value ?? ""}
                        onChange={(event) =>
                          quantityField.onChange(Number(event.target.value))
                        }
                        className="text-center"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isPending || fields.length === 1}
                onClick={() => remove(index)}
                className="shrink-0"
              >
                <Trash2Icon />
                <span className="sr-only">Remove product</span>
              </Button>
            </div>
          ))}
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  placeholder="Internal notes"
                  disabled={isPending}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Order total</span>
          <span className="text-lg font-semibold">{formatPrice(total, true)}</span>
        </div>

        <div className="flex justify-between gap-x-2">
          {onCancel && (
            <Button
              variant="ghost"
              type="button"
              disabled={isPending}
              onClick={onCancel}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isPending}>
            Create order
          </Button>
        </div>
      </form>
    </Form>
  );
};
