import * as z from "zod";
import { Data } from "@puckeditor/core";

import { SITE_REGION_KEYS } from "./constants";

export const siteRegionKeySchema = z.enum(SITE_REGION_KEYS);

export type SiteRegionKeyValue = z.infer<typeof siteRegionKeySchema>;

export const siteRegionCreateSchema = z.object({
  key: siteRegionKeySchema,
});

export type SiteRegionCreateValues = z.infer<typeof siteRegionCreateSchema>;

export const siteRegionUpdateSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  rootId: z.string().min(1, { error: "Root Id is required" }),
  // Site regions have their own palettes, so the document is not limited to
  // the page component map. The forms are dehydrated server-side before save.
  puckData: z.custom<Data>().nullable().optional(),
});

export type SiteRegionUpdateValues = z.infer<typeof siteRegionUpdateSchema>;

export const siteRegionPublishSchema = z.object({
  id: z.string().min(1, { error: "Id is required" }),
  rootId: z.string().min(1, { error: "Root Id is required" }),
});

export type SiteRegionPublishValues = z.infer<typeof siteRegionPublishSchema>;

export const siteRegionUnpublishSchema = z.object({
  key: siteRegionKeySchema,
});

export type SiteRegionUnpublishValues = z.infer<
  typeof siteRegionUnpublishSchema
>;
