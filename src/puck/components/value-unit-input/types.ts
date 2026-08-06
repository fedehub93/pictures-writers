export interface ValueUnitPreset {
  label: string; // Es: "3XL"
  value: string; // Es: "1.875"
  unit: string; // Es: "rem"
  description?: string; // Es: "30px"
}

export interface ValueUnitInputProps {
  name: string;
  onChange: (val: string) => void;
  value?: string;
  units?: string[];
  defaultUnit?: string;
  allowedKeywords?: string[];
  placeholder?: string;
  presets?: ValueUnitPreset[];
}
