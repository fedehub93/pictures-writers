import { z } from "zod";

export const faqItemSchema = z.object({
  id: z.string().optional(),
  question: z.string().optional(),
  answer: z.string().optional(),
  sort: z.coerce.number<number>(),
});

export const faqItemsSchema = z.array(faqItemSchema);

export type FaqItem = z.infer<typeof faqItemSchema>;
