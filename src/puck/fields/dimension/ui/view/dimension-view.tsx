import type { FieldDef } from "@/puck/types";

import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";

import type { DimensionProps } from "../../index";

const layoutFields: FieldDef<DimensionProps>[] = [
  { key: "width", label: "Width", type: "unit", placeholder: "auto" },
  { key: "height", label: "Height", type: "unit", placeholder: "auto" },
  { key: "maxWidth", label: "Max width", type: "unit", placeholder: "auto" },
  { key: "minHeight", label: "Min height", type: "unit", placeholder: "auto" },
];

const marginFields: FieldDef<DimensionProps>[] = [
  { key: "marginTop", label: "Top", type: "unit", placeholder: "0" },
  { key: "marginRight", label: "Right", type: "unit", placeholder: "0" },
  { key: "marginBottom", label: "Bottom", type: "unit", placeholder: "0" },
  { key: "marginLeft", label: "Left", type: "unit", placeholder: "0" },
];

const paddingFields: FieldDef<DimensionProps>[] = [
  { key: "paddingTop", label: "Top", type: "unit", placeholder: "0" },
  { key: "paddingRight", label: "Right", type: "unit", placeholder: "0" },
  { key: "paddingBottom", label: "Bottom", type: "unit", placeholder: "0" },
  { key: "paddingLeft", label: "Left", type: "unit", placeholder: "0" },
];

const aspectRatioOptions = [
  { value: "auto", label: "Auto (Default)" },
  { value: "1 / 1", label: "1:1 (Square)" },
  { value: "4 / 3", label: "4:3 (Classic)" },
  { value: "16 / 9", label: "16:9 (Wide)" },
  { value: "21 / 9", label: "21:9 (Cinematic)" },
  { value: "9 / 16", label: "9:16 (Vertical)" },
];

interface DimensionViewProps {
  currentValues: Partial<DimensionProps>;
  renderValues: DimensionProps;
  resetProp: (key: keyof DimensionProps) => void;
  onUpdate: (values: Partial<DimensionProps>) => void;
}

export const DimensionView = ({
  currentValues,
  renderValues,
  resetProp,
  onUpdate,
}: DimensionViewProps) => {
  const isAspectRatioModified = currentValues.aspectRatio !== undefined;
  const currentRatioValue = renderValues.aspectRatio;

  const isCustomRatio =
    currentRatioValue !== "" &&
    !aspectRatioOptions.some((opt) => opt.value === currentRatioValue);

  const selectValue = isCustomRatio ? "custom" : currentRatioValue || "auto";

  return (
    <div className="flex flex-col gap-y-2 p-1">
      {/* --- LAYOUT --- */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-1">
        {layoutFields.map((field) => {
          const isModified = currentValues[field.key] !== undefined;
          const displayValue = renderValues[field.key] ?? "";
          return (
            <div key={field.key} className="flex flex-col gap-y-1">
              <PropHeader
                name={field.key}
                label={field.label}
                isModified={isModified}
                onReset={() => resetProp(field.key)}
              />
              <ValueUnitInput
                name={field.key}
                value={displayValue}
                onChange={(newVal) =>
                  onUpdate({ [field.key]: newVal || undefined })
                }
                placeholder={field.placeholder}
              />
            </div>
          );
        })}

        <div className="col-span-2 flex flex-col gap-y-1">
          <PropHeader
            name="aspectRatio"
            label="Aspect Ratio"
            isModified={isAspectRatioModified}
            onReset={() => resetProp("aspectRatio")}
          />

          <div className="flex gap-x-2">
            <Select
              value={selectValue}
              onValueChange={(val) => {
                if (val === "custom") {
                  onUpdate({ aspectRatio: "2 / 1" });
                } else {
                  onUpdate({ aspectRatio: val === "auto" ? "" : val });
                }
              }}
            >
              <SelectTrigger className="h-8 text-xs flex-1">
                <SelectValue placeholder="Auto" />
              </SelectTrigger>
              <SelectContent>
                {aspectRatioOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>

            {isCustomRatio && (
              <Input
                className="h-8 text-xs w-1/2 placeholder:text-xs"
                value={currentRatioValue}
                onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                placeholder="es. 3 / 2"
              />
            )}
          </div>
        </div>
      </div>

      {/* --- MARGIN --- */}
      <div className="mt-4">
        <span className="text-sm font-medium">Margin</span>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
          {marginFields.map((field) => {
            const isModified = currentValues[field.key] !== undefined;
            const displayValue = renderValues[field.key] ?? "";
            return (
              <div key={field.key} className="flex flex-col gap-y-1">
                <PropHeader
                  name={field.key}
                  label={field.label}
                  isModified={isModified}
                  onReset={() => resetProp(field.key)}
                />
                <ValueUnitInput
                  name={field.key}
                  value={displayValue}
                  onChange={(newVal) =>
                    onUpdate({ [field.key]: newVal || undefined })
                  }
                  placeholder={field.placeholder}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* --- PADDING --- */}
      <div className="mt-4">
        <span className="text-sm font-medium">Padding</span>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
          {paddingFields.map((field) => {
            const isModified = currentValues[field.key] !== undefined;
            const displayValue = renderValues[field.key] ?? "";
            return (
              <div key={field.key} className="flex flex-col gap-y-1">
                <PropHeader
                  name={field.key}
                  label={field.label}
                  isModified={isModified}
                  onReset={() => resetProp(field.key)}
                />
                <ValueUnitInput
                  name={field.key}
                  value={displayValue}
                  onChange={(newVal) =>
                    onUpdate({ [field.key]: newVal || undefined })
                  }
                  placeholder={field.placeholder}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
