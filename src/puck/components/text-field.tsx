import { Input } from "@/shared/ui/input";

import { PropHeader } from "./prop-header";
import { ValueUnitInput } from "./value-unit-input";
import { ValueUnitPreset } from "./value-unit-input/types";

export type InputTextFieldProps<T> = {
  name: Extract<keyof T, string>;
  label: string;
  placeholder?: string;
  type?: "unit" | "text";
  currentValues: Partial<T>;
  renderValues: T;
  resetProp: (key: Extract<keyof T, string>) => void;
  update: (updates: Partial<T>) => void;
  presets?: ValueUnitPreset[];
};

// Componente React generico
export const InputTextField = <T,>({
  name,
  label,
  placeholder,
  type = "text",
  currentValues,
  renderValues,
  resetProp,
  update,
  presets,
}: InputTextFieldProps<T>) => {
  const isModified = currentValues[name] !== undefined;

  // Fallback a stringa vuota per evitare warning di React su input uncontrolled
  const displayValue = (renderValues[name] ?? "") as string;

  return (
    <div className="flex flex-col gap-y-1">
      <PropHeader
        name={name}
        label={label}
        isModified={isModified}
        onReset={() => resetProp(name)}
      />
      {type === "unit" ? (
        <ValueUnitInput
          name={name}
          value={displayValue}
          onChange={(newVal) =>
            update({ [name]: newVal || undefined } as Partial<T>)
          }
          placeholder={placeholder}
          presets={presets}
        />
      ) : (
        <Input
          id={name}
          value={displayValue}
          placeholder={placeholder}
          onChange={(e) =>
            update({ [name]: e.target.value || undefined } as Partial<T>)
          }
          className="h-8 px-2 text-xs!"
          autoComplete="off"
        />
      )}
    </div>
  );
};
