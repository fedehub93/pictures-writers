import type {
  WidgetConfig,
  WidgetConfigOption,
  WidgetFilterChip,
} from "./types";

/**
 * The stored string entries of one config key, dropping anything that is not a
 * string. Absent or malformed config yields an empty array. Shared (rather than
 * living in the dashboard) so a domain module can read its own config without
 * depending on the dashboard.
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
 * Summarises a multi-choice filter as a single chip showing the selection in
 * effect — the stored value, or the widget's default when nothing is stored, so
 * the filter is always visible. Shared by the operational widgets whose only
 * filter is a multiselect, so the option-label mapping lives in one place.
 */
export const summarizeMultiselect = (
  config: WidgetConfig | undefined,
  field: string,
  options: WidgetConfigOption[],
  defaultValues: readonly string[],
): WidgetFilterChip[] => {
  const stored = configStringValues(config, field);
  const effective = stored.length > 0 ? stored : defaultValues;

  const label = effective
    .map(
      (value) =>
        options.find((option) => option.value === value)?.label ?? value,
    )
    .join(", ");

  return [{ key: field, label }];
};
