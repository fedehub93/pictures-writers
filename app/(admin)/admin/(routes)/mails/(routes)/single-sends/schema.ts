import * as z from "zod";

export const singleSendInsertSchema = z.object({
  name: z.string().min(1, { error: "Nameame is required" }),
  emailTemplateId: z.string().min(1, { error: "Email template is required" }),
});

export type SinglSendInsertValues = z.infer<typeof singleSendInsertSchema>;

export const singleSendUpdateSchema = singleSendInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type SingleSendUpdateValues = Partial<
  Omit<z.infer<typeof singleSendUpdateSchema>, "id">
> &
  Pick<z.infer<typeof singleSendUpdateSchema>, "id">;
