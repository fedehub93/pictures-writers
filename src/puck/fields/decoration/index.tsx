import { useCallback } from "react";
import { PaletteIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";

// Utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import { ValueColorInput } from "@/puck/components/value-color-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

export interface DecorationProps {
  opacity?: string;
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

type FieldDef = { key: keyof DecorationProps; label: string };

const opacityFields: FieldDef[] = [
  { key: "opacity", label: "Opacity (es. 0.5 o 50%)" },
];

const radiusFields: FieldDef[] = [
  { key: "borderTopLeftRadius", label: "Top Left" },
  { key: "borderTopRightRadius", label: "Top Right" },
  { key: "borderBottomLeftRadius", label: "Bottom Left" },
  { key: "borderBottomRightRadius", label: "Bottom Right" },
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

    const update = useCallback(
      (updates: Partial<DecorationProps>) => {
        onChange({
          ...state,
          [viewportKey]: {
            ...currentValues,
            ...updates,
          },
        });
      },
      [onChange, state, viewportKey, currentValues],
    );

    const resetProp = useCallback(
      (key: keyof DecorationProps) => {
        const newViewportState = { ...currentValues };
        delete newViewportState[key];

        onChange({
          ...state,
          [viewportKey]: newViewportState,
        });
      },
      [onChange, state, viewportKey, currentValues],
    );

    const renderField = useCallback(
      ({ key, label }: FieldDef) => {
        const isModified = currentValues[key] !== undefined;

        return (
          <div key={`container-${key}`} className="flex flex-col gap-y-1">
            <PropHeader
              key={`prop-${key}`}
              name={key}
              label={label}
              isModified={isModified}
              onReset={() => resetProp(key)}
            />
            <ValueUnitInput
              key={`value-${key}`}
              name={key}
              value={renderValues[key] ?? ""}
              onChange={(newVal) => update({ [key]: newVal || undefined })}
            />
          </div>
        );
      },
      [currentValues, renderValues, resetProp, update],
    );

    return (
      <>
        {/* --- OPACITY --- */}
        <div className="grid grid-cols-1 gap-y-4 p-1">
          {opacityFields.map(renderField)}
        </div>

        {/* --- BORDER --- */}
        <div className="mt-4">
          <span className="text-sm font-medium">Border</span>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
            {renderField({ key: "borderWidth", label: "Width" })}
            {/* ROW 1: Border Style (Col 2) */}
            <div className="flex flex-col gap-y-1">
              <PropHeader
                name="borderStyle"
                label="Style"
                isModified={currentValues.borderStyle !== undefined}
                onReset={() => resetProp("borderStyle")}
              />
              <Select
                value={renderValues.borderStyle || "none"}
                onValueChange={(val) =>
                  update({ borderStyle: val === "none" ? undefined : val })
                }
              >
                <SelectTrigger className="w-full h-9 bg-transparent border-input">
                  <SelectValue placeholder="Style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="solid">Solid</SelectItem>
                  <SelectItem value="dashed">Dashed</SelectItem>
                  <SelectItem value="dotted">Dotted</SelectItem>
                  <SelectItem value="double">Double</SelectItem>
                </SelectContent>
              </Select>
            </div>

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
            {radiusFields.map(renderField)}
          </div>
        </div>
      </>
    );
  },
);
