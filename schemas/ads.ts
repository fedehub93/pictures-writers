import { z } from "zod";

import {
  AdItemSourceType,
  AdLayoutType,
  AdPositionPlacement,
  AdPositionReference,
} from "@/generated/prisma";

/**
 * Ad Campaign
 */

export const adCampaignFormSchema = z.object({
  name: z.string().min(1, {
    error: "Name is required",
  }),
  isActive: z.boolean(),
});

export type AdCampaignFormValues = z.infer<typeof adCampaignFormSchema>;

/**
 * Ad Block
 */

export const adBlockFormSchema = z.object({
  isActive: z.boolean(),
  label: z.string().min(1, {
    error: "Label is required!",
  }),
  layoutType: z.enum(AdLayoutType, {
    error: () => ({ message: "Select a type" }),
  }),
  placement: z.enum(AdPositionPlacement, {
    error: () => ({ message: "Select a placement" }),
  }),
  reference: z.enum(AdPositionReference, {
    error: () => ({ message: "Select a reference" }),
  }),
  referenceCount: z.coerce.number<number>(),
  minWords: z.coerce.number<number>(),
  excludedPostIds: z.array(z.string()),
  excludedCategoryIds: z.array(z.string()),
  excludedTagIds: z.array(z.string()),
});

export type AdBlockFormValues = z.infer<typeof adBlockFormSchema>;

/**
 * Ad Item
 */

export const adItemFormSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  url: z.string().nullable(),
  sourceType: z.enum(AdItemSourceType, {
    error: () => ({ message: "Select a source type" }),
  }),
  postRootId: z.string().nullable(),
  productRootId: z.string().nullable(),
});

export type AdItemFormValues = z.infer<typeof adItemFormSchema>;
