import type {
  WidgetConfig,
  WidgetConfigField,
  WidgetConfigMultiSelectField,
} from "@/shared/dashboard/types";

/**
 * The value a config field should show. The stored value is used only while it
 * is still one of the field's options, so a stale or no-longer-permitted choice
 * falls back to the first option.
 */
export const configFieldValue = (
  config: WidgetConfig | undefined,
  field: WidgetConfigField,
): string | undefined => {
  const value = config?.[field.name];

  if (
    typeof value === "string" &&
    field.options.some((option) => option.value === value)
  ) {
    return value;
  }

  return field.options[0]?.value;
};

/**
 * Returns a copy of the instance config with the field set to `value`. Other
 * fields are preserved, so configuring one choice never drops another.
 */
export const withConfigValue = (
  config: WidgetConfig | undefined,
  field: WidgetConfigField,
  value: string,
): Record<string, unknown> => ({ ...(config ?? {}), [field.name]: value });

/**
 * The values a multi-choice config field should show: the stored array, kept
 * only for values that are still options. Absent or malformed config yields an
 * empty selection.
 */
export const configFieldValues = (
  config: WidgetConfig | undefined,
  field: WidgetConfigMultiSelectField,
): string[] => {
  const value = config?.[field.name];

  if (!Array.isArray(value)) return [];

  const allowed = new Set(field.options.map((option) => option.value));

  return value.filter(
    (item): item is string => typeof item === "string" && allowed.has(item),
  );
};

/** Returns a copy of the instance config with a multi-choice field replaced. */
export const withConfigValues = (
  config: WidgetConfig | undefined,
  field: WidgetConfigMultiSelectField,
  values: string[],
): Record<string, unknown> => ({ ...(config ?? {}), [field.name]: values });
