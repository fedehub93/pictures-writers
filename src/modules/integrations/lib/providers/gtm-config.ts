import * as z from "zod";

const CONTAINER_ID_PATTERN = /^GTM-[A-Z0-9]{4,}$/;

/**
 * Non-secret Google Tag Manager configuration.
 *
 * The container id is normalised (trimmed and uppercased) before validation so
 * an id pasted in lowercase from the GTM dashboard is accepted. Snippets are
 * rejected on purpose: the pattern is anchored to the whole value, and picking
 * one `GTM-` occurrence out of arbitrary HTML could silently store the wrong
 * identifier.
 */
export const gtmConfigSchema = z.object({
  containerId: z
    .string()
    .trim()
    .min(1, "Container ID is required")
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => CONTAINER_ID_PATTERN.test(value),
      "Container ID must look like GTM-XXXXXXX",
    ),
});

export type GtmConfig = z.infer<typeof gtmConfigSchema>;
