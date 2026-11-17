import { PanelSelectTrigger } from "@/puck/components/panel-control";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shared/ui/select";

import { PropHeader } from "../prop-header";

export type SelectFieldProps<T> = {
  name: Extract<keyof T, string>;
  label: string;
  options: string[];
  placeholder?: string;
  currentValues: Partial<T>;
  renderValues: T;
  resetProp: (key: Extract<keyof T, string>) => void;
  update: (updates: Partial<T>) => void;
};

export const SelectField = <T,>({
  name,
  label,
  options,
  placeholder,
  currentValues,
  renderValues,
  resetProp,
  update,
}: SelectFieldProps<T>) => {
  const isModified = currentValues[name] !== undefined;
  const displayValue = (renderValues[name] ?? "") as string;

  return (
    <div className="flex flex-col gap-y-1">
      <PropHeader
        name={name}
        label={label}
        isModified={isModified}
        onReset={() => resetProp(name)}
      />
      <Select
        value={displayValue}
        onValueChange={(val: string) =>
          update({
            [name]: val === placeholder ? undefined : val,
          } as Partial<T>)
        }
      >
        <PanelSelectTrigger id={name} className="w-full">
          <SelectValue placeholder={placeholder} />
        </PanelSelectTrigger>
        <SelectContent>
          {options.map((v) => (
            <SelectItem key={v} value={v}>
              {v}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
