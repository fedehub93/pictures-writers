"use client";

import { useQuery } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";

import type { NodeConfigPanelProps } from "@/modules/automations/editor/config/node-config-panel-types";
import { formatPrice } from "@/lib/format";
import { useTRPC } from "@/trpc/client";
import { Button } from "@/shared/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Textarea } from "@/shared/ui/textarea";

interface OrderItemDraft {
  productId: string;
  quantity: number;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readItems(value: unknown): OrderItemDraft[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((entry) => {
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const productId = stringValue(record.productId);
    const quantity =
      typeof record.quantity === "number" && record.quantity > 0
        ? record.quantity
        : Number(record.quantity) > 0
          ? Number(record.quantity)
          : 1;

    return [{ productId, quantity }];
  });
}

/**
 * Configuration panel for the `CREATE_ORDER` action. `customerId` is usually
 * `{{ input.customerId }}`, seeded from the predecessor `CREATE_CUSTOMER`
 * output; products and quantities form the order lines.
 */
export function CreateOrderConfigPanel({
  data,
  onChange,
}: NodeConfigPanelProps) {
  const trpc = useTRPC();
  const { data: options, isLoading } = useQuery(
    trpc.orders.getFormOptions.queryOptions(),
  );

  const products = options?.products ?? [];
  const items = readItems(data.items);

  const setItems = (next: OrderItemDraft[]) => onChange({ items: next });

  const updateItem = (index: number, patch: Partial<OrderItemDraft>) => {
    setItems(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor="create-order-customer">Customer</FieldLabel>
        <Input
          id="create-order-customer"
          value={stringValue(data.customerId)}
          onChange={(event) => onChange({ customerId: event.target.value })}
          placeholder="{{ input.customerId }}"
        />
        <FieldDescription>
          The customer the order belongs to. Chain a Create customer step and use
          {" {{ input.customerId }}"}.
        </FieldDescription>
      </Field>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <FieldLabel>Products</FieldLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setItems([...items, { productId: "", quantity: 1 }])}
          >
            <PlusIcon data-icon="inline-start" />
            Add product
          </Button>
        </div>

        {items.length === 0 ? (
          <FieldDescription>
            Add at least one product for the order.
          </FieldDescription>
        ) : null}

        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-2">
            <Select
              value={item.productId}
              onValueChange={(value) => updateItem(index, { productId: value })}
              disabled={isLoading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.title} — {formatPrice(product.price ?? 0, true)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={1}
              className="w-24 text-center"
              value={item.quantity}
              onChange={(event) =>
                updateItem(index, { quantity: Number(event.target.value) })
              }
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => setItems(items.filter((_, i) => i !== index))}
            >
              <Trash2Icon />
              <span className="sr-only">Remove product</span>
            </Button>
          </div>
        ))}
      </div>

      <Field>
        <FieldLabel htmlFor="create-order-notes">Notes</FieldLabel>
        <Textarea
          id="create-order-notes"
          rows={3}
          value={stringValue(data.notes)}
          onChange={(event) => onChange({ notes: event.target.value })}
          placeholder="Internal notes"
        />
      </Field>
    </FieldGroup>
  );
}
