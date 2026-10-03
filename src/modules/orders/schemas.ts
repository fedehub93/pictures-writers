import * as z from "zod";

import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, MIN_PAGE_SIZE } from "./constants";

export const ORDER_STATUSES = [
  "DRAFT",
  "PENDING",
  "COMPLETED",
  "CANCELLED",
] as const;

export const orderStatusSchema = z.enum(ORDER_STATUSES);

export const orderItemInputSchema = z.object({
  productId: z.string().min(1, { error: "Product is required" }),
  quantity: z
    .number()
    .int()
    .min(1, { error: "Quantity must be at least 1" }),
});

/**
 * Admin order creation is always a MANUAL offline sale; other sources are set
 * by the automation and checkout writers, never by the admin form.
 */
export const orderInsertSchema = z.object({
  customerId: z.string().min(1, { error: "Customer is required" }),
  items: z
    .array(orderItemInputSchema)
    .min(1, { error: "Add at least one product" }),
  orderDate: z.date().optional(),
  notes: z.string().nullish(),
});

export type OrderInsertValues = z.infer<typeof orderInsertSchema>;

export const orderListSchema = z.object({
  page: z.number().default(DEFAULT_PAGE),
  pageSize: z
    .number()
    .int()
    .min(MIN_PAGE_SIZE)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE),
  search: z.string().nullish(),
  status: orderStatusSchema.nullish(),
});
