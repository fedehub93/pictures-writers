// ./types.ts o in testa a use-value-unit-input.ts
export interface ValueUnitPreset {
  label: string;       // Es: "3XL"
  value: string;       // Es: "1.875" (mantenuto stringa per coerenza con textInput)
  unit: string;        // Es: "rem"
  description?: string; // Es: "30px"
}