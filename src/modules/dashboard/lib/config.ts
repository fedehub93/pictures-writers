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
 * The stored string entries of one config key, dropping anything that is not a
 * string. Absent or malformed config yields an empty array.
 */
export const configStringValues = (
  config: WidgetConfig | undefined,
  name: string,
): string[] => {
  const value = config?.[name];

  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
};

/**
 * The values a multi-choice config field should show: the stored array, kept
 * only for values that are still options. Absent or malformed config yields an
 * empty selection, unless the field is `allByDefault`, in which case an absent
 * or empty selection reads as every option.
 */
export const configFieldValues = (
  config: WidgetConfig | undefined,
  field: WidgetConfigMultiSelectField,
): string[] => {
  const allowed = new Set(field.options.map((option) => option.value));

  const selected = configStringValues(config, field.name).filter((value) =>
    allowed.has(value),
  );

  if (field.allByDefault && selected.length === 0) {
    return field.options.map((option) => option.value);
  }

  return selected;
};

/** Returns a copy of the instance config with a multi-choice field replaced. */
export const withConfigValues = (
  config: WidgetConfig | undefined,
  field: WidgetConfigMultiSelectField,
  values: string[],
): Record<string, unknown> => ({ ...(config ?? {}), [field.name]: values });
