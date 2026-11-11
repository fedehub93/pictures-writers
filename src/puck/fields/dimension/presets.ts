import type { ValueUnitPreset } from "@/puck/components/value-unit-input/types";

/**
 * Width states offered next to the numeric input.
 *
 * The stored prop keeps its shape (`width?: string`), so no document migration
 * is involved. *Fill* stores the same `100%` that `getDimensionVars` implies
 * when a breakpoint authors only a max width, *Fit content* stores
 * `fit-content`, and *Auto* stores nothing — the same as clearing the field.
 * The empty value is therefore still the default, it simply has a name now.
 */
export const WIDTH_PRESETS: ValueUnitPreset[] = [
  {
    label: "Auto",
    value: "",
    unit: "-",
    description: "no width",
  },
  {
    label: "Fill",
    value: "100",
    unit: "%",
    description: "full width",
  },
  {
    label: "Fit content",
    value: "fit-content",
    unit: "-",
    description: "natural size",
  },
];
