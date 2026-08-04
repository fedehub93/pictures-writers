import { PaletteIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";

// Utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import { ValueColorInput } from "@/puck/components/value-color-input";
import { InputTextField } from "@/puck/components/text-field";
import { FieldDef } from "@/puck/types";
import { SelectField } from "@/puck/components/select-field";

export interface DecorationProps {
  opacity?: string;
  backgroundColor?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  borderTopLeftRadius?: string;
  borderTopRightRadius?: string;
  borderBottomLeftRadius?: string;
  borderBottomRightRadius?: string;
}

// Default minimi (vuoti)
const defaultDecoration: Record<Breakpoint, DecorationProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const opacityFields: FieldDef<DecorationProps>[] = [
  {
    key: "opacity",
    label: "Opacity",
    placeholder: "1",
    type: "unit",
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

const usePuck = createUsePuck();

export const DecorationField = withAccordionField(
  "Decoration",
  <PaletteIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<DecorationProps>) => void;
    value?: Responsive<DecorationProps>;
  }) => {
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    const state = value ?? {};
    const currentValues: Partial<DecorationProps> = state[viewportKey] ?? {};

    // Il cascade gestisce ora gli undefined proprietà per proprietà
    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultDecoration,
    );

    const update = (updates: Partial<DecorationProps>) => {
      onChange({
        ...state,
        [viewportKey]: {
          ...currentValues,
          ...updates,
        },
      });
    };

    const resetProp = (key: keyof DecorationProps) => {
      const newViewportState = { ...currentValues };
      delete newViewportState[key];

      onChange({
        ...state,
        [viewportKey]: newViewportState,
      });
    };

    return (
      <div className="flex flex-col space-y-2 p-1">
        {/* --- OPACITY --- */}
        <div className="grid grid-cols-1 gap-y-4">
          {opacityFields.map((field) => (
            <InputTextField
              key={field.key}
              name={field.key}
              label={field.label}
              placeholder={field.placeholder}
              type="unit"
              currentValues={currentValues}
              renderValues={renderValues}
              resetProp={resetProp}
              update={update}
            />
          ))}
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
              update({ backgroundColor: newVal || undefined })
            }
          />
        </div>

        {/* --- BORDER --- */}
        <div className="mt-4">
          <span className="text-sm font-medium">Border</span>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
            <InputTextField
              key="borderWidth"
              name="borderWidth"
              label="Border Width"
              placeholder="3"
              type="unit"
              currentValues={currentValues}
              renderValues={renderValues}
              resetProp={resetProp}
              update={update}
            />
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
              update={update}
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
                  update({ borderColor: newVal || undefined })
                }
              />
            </div>
          </div>
        </div>

        {/* --- BORDER RADIUS --- */}
        <div className="mt-4">
          <span className="text-sm font-medium">Border Radius</span>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
            {radiusFields.map((field) => (
              <InputTextField
                key={field.key}
                name={field.key}
                label={field.label}
                placeholder={field.placeholder}
                type={field.type}
                currentValues={currentValues}
                renderValues={renderValues}
                resetProp={resetProp}
                update={update}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
);
