import { z } from "zod";

export const propertiesSchema = z.object({
  theme: z.string().optional(),
  submission: z.object({
    onSuccess: z.discriminatedUnion("type", [
      z.object({
        type: z.literal("toast"),
        successMessage: z
          .string()
          .min(1, "Il messaggio di successo è obbligatorio"),
      }),
      z.object({
        type: z.literal("redirect"),
        url: z.url("Inserisci un URL o path valido (es. /success)"),
      }),
    ]),
  }),
});

export type PropertiesFormSchemaType = z.infer<typeof propertiesSchema>;
