import type { FieldDef } from "@/puck/types";

import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import { ValueColorInput } from "@/puck/components/value-color-input";
import { SelectField } from "@/puck/components/select-input";

import type { DecorationProps } from "../../index";

const opacityFields: FieldDef<DecorationProps>[] = [
  {
    key: "opacity",
    label: "Opacity",
    placeholder: "1",
    type: "unit",
    units: ["%"],
  },
];

const borderStyles = ["none", "solid", "dashed", "dotted", "double"];

const radiusFields: FieldDef<DecorationProps>[] = [
  {
    key: "borderTopLeftRadius",
    label: "Top Left",
    type: "unit",
    placeholder: "0",
  },
  {
    key: "borderTopRightRadius",
    label: "Top Right",
    type: "unit",
    placeholder: "0",
  },
  {
    key: "borderBottomLeftRadius",
    label: "Bottom Left",
    type: "unit",
    placeholder: "0",
  },
  {
    key: "borderBottomRightRadius",
    label: "Bottom Right",
    type: "unit",
    placeholder: "0",
  },
];

interface DecorationViewProps {
  currentValues: Partial<DecorationProps>;
  renderValues: DecorationProps;
  resetProp: (key: keyof DecorationProps) => void;
  onUpdate: (values: Partial<DecorationProps>) => void;
}

export const DecorationView = ({
  currentValues,
  renderValues,
  resetProp,
  onUpdate,
}: DecorationViewProps) => {
  return (
    <div className="flex flex-col gap-y-2 p-1">
      {/* --- OPACITY --- */}
      <div className="grid grid-cols-1 gap-y-4">
        {opacityFields.map((field) => {
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
                units={field.units}
                defaultUnit="%"
              />
            </div>
          );
        })}
      </div>

      {/* --- BACKGROUND COLOR */}
      <div
        key={`container-background-color`}
        className="flex flex-col gap-y-1 mt-4"
      >
        <PropHeader
          key={`prop-background-color`}
          name="backgroundColor"
          label="Background Color"
          isModified={currentValues.backgroundColor !== undefined}
          onReset={() => resetProp("backgroundColor")}
        />
        <ValueColorInput
          name="backgroundColor"
          placeholder="transparent"
          value={renderValues.backgroundColor ?? ""}
          onChange={(newVal) =>
            onUpdate({ backgroundColor: newVal || undefined })
          }
        />
      </div>

      {/* --- BORDER --- */}
      <div className="mt-4">
        <span className="text-sm font-medium">Border</span>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="borderWidth"
              label="Border Width"
              isModified={currentValues.borderWidth !== undefined}
              onReset={() => resetProp("borderWidth")}
            />
            <ValueUnitInput
              name="borderWidth"
              value={renderValues.borderWidth ?? ""}
              onChange={(newVal) =>
                onUpdate({ borderWidth: newVal || undefined })
              }
              placeholder="3"
            />
          </div>

          {/* ROW 1: Border Style (Col 2) */}
          <SelectField
            key="borderStyle"
            name="borderStyle"
            label="Border Style"
            placeholder="none"
            options={borderStyles}
            currentValues={currentValues}
            renderValues={renderValues}
            resetProp={resetProp}
            update={onUpdate}
          />
          <div
            key={`container-border-color`}
            className="col-span-2 flex flex-col gap-y-1"
          >
            <PropHeader
              key={`prop-border-color`}
              name="borderColor"
              label="Color"
              isModified={currentValues.borderColor !== undefined}
              onReset={() => resetProp("borderColor")}
            />
            <ValueColorInput
              name="borderColor"
              placeholder="currentcolor"
              value={renderValues.borderColor ?? ""}
              onChange={(newVal) =>
                onUpdate({ borderColor: newVal || undefined })
              }
            />
          </div>
        </div>
      </div>

      {/* --- BORDER RADIUS --- */}
      <div className="mt-4">
        <span className="text-sm font-medium">Border Radius</span>
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
          {radiusFields.map((field) => {
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
