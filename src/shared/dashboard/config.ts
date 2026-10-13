import type { WidgetConfig } from "./types";

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

const sameArray = (a: readonly unknown[], b: readonly unknown[]) => {
  if (a.length !== b.length) return false;

  const sortedA = [...a].sort();
  const sortedB = [...b].sort();

  return sortedA.every((value, index) => value === sortedB[index]);
};

const sameValue = (a: unknown, b: unknown) =>
  Array.isArray(a) && Array.isArray(b) ? sameArray(a, b) : a === b;

/**
 * Whether an instance's config differs from the definition's default — i.e. the
 * user changed at least one setting. False when the definition declares no
 * default or the instance carries no config (a widget with no stored config
 * shows its default), so a configurable widget is only "customised" when the
 * user actually moved something. Array values are compared as sets, so a
 * re-ordered selection still reads as the default.
 */
export const configDiffersFromDefault = (
  defaultConfig: WidgetConfig | undefined,
  config: WidgetConfig | undefined,
): boolean => {
  if (!defaultConfig || !config) return false;

  const keys = Object.keys(config);
  if (keys.length !== Object.keys(defaultConfig).length) return true;

  return keys.some((key) => !sameValue(config[key], defaultConfig[key]));
};


