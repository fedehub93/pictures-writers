import * as z from "zod";

export const singleSendInsertSchema = z.object({
  name: z.string().min(1, { error: "Name is required" }),
  emailTemplateId: z.string().optional(),
  subject: z.string().optional(),
  audiences: z
    .array(
      z.object({
        id: z.string(),
      }),
    )
    .min(1, {
      error: "Almost one audience is required",
    }),
  designData: z.any().optional(),
  bodyHtml: z.string().optional(),
});

export type SingleSendInsertValues = z.infer<typeof singleSendInsertSchema>;

export const singleSendUpdateSchema = singleSendInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type SingleSendUpdateValues = Partial<
  Omit<z.infer<typeof singleSendUpdateSchema>, "id">
> &
  Pick<z.infer<typeof singleSendUpdateSchema>, "id">;
