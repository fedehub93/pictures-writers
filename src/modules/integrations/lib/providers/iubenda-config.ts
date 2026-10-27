import * as z from "zod";

/** Languages the admin form offers; the schema stays open to more. */
export const IUBENDA_LANGS = ["it", "en"] as const;

const numericId = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .regex(/^\d+$/, `${label} must contain digits only`);

/**
 * Non-secret Iubenda configuration.
 *
 * `autoblocking` selects the loader: true uses the autoblocking loader, false
 * uses the sync loader. `consentMode` makes the CMP own Google Consent Mode.
 */
export const iubendaConfigSchema = z.object({
  siteId: numericId("Site ID"),
  cookiePolicyId: numericId("Cookie policy ID"),
  lang: z.enum(IUBENDA_LANGS, "Language is required"),
  autoblocking: z.boolean().default(true),
  consentMode: z.boolean().default(true),
});

export type IubendaConfig = z.infer<typeof iubendaConfigSchema>;
