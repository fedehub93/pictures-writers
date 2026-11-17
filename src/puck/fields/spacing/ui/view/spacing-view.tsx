import type { FieldDef } from "@/puck/types";

import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";

import type { SpacingProps } from "../../index";

const marginFields: FieldDef<SpacingProps>[] = [
  { key: "marginTop", label: "Top", type: "unit", placeholder: "0" },
  { key: "marginRight", label: "Right", type: "unit", placeholder: "0" },
  { key: "marginBottom", label: "Bottom", type: "unit", placeholder: "0" },
  { key: "marginLeft", label: "Left", type: "unit", placeholder: "0" },
];

const paddingFields: FieldDef<SpacingProps>[] = [
  { key: "paddingTop", label: "Top", type: "unit", placeholder: "0" },
  { key: "paddingRight", label: "Right", type: "unit", placeholder: "0" },
  { key: "paddingBottom", label: "Bottom", type: "unit", placeholder: "0" },
  { key: "paddingLeft", label: "Left", type: "unit", placeholder: "0" },
];

interface SpacingViewProps {
  currentValues: Partial<SpacingProps>;
  renderValues: SpacingProps;
  resetProp: (key: keyof SpacingProps) => void;
  onUpdate: (values: Partial<SpacingProps>) => void;
}

/**
 * The Spacing section: outside space (Margin) above inside space (Padding),
 * each as the same two-column group the combined field shipped.
 */
export const SpacingView = ({
  currentValues,
  renderValues,
  resetProp,
  onUpdate,
}: SpacingViewProps) => {
  const renderGroup = (
    label: "Margin" | "Padding",
    fields: FieldDef<SpacingProps>[],
  ) => (
    <div className="mt-4">
      <span className="text-sm font-medium">{label}</span>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
        {fields.map((field) => {
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
  );

  return (
    <div className="flex flex-col gap-y-2 p-1">
      {renderGroup("Margin", marginFields)}
      {renderGroup("Padding", paddingFields)}
    </div>
  );
};
