import * as z from "zod";

export const formSubmissionInsertSchema = z.object({
  formId: z.string().min(1, { error: "Form ID is required" }),
  data: z.record(z.string(), z.any()),
});

export type FormSubmissionInsertValues = z.infer<
  typeof formSubmissionInsertSchema
>;

export const formSubmissionUpdateSchema = formSubmissionInsertSchema.extend({
  id: z.string().min(1, { error: "Id is required" }),
});

export type FormSubmissionUpdateValues = z.infer<
  typeof formSubmissionUpdateSchema
>;
