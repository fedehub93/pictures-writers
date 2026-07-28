import {
  GridIcon,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  StretchVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  StretchHorizontal,
} from "lucide-react";

import { createUsePuck } from "@puckeditor/core";

import { SegmentedControl } from "@/puck/components/segmented-control";
import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import { InputTextField } from "@/puck/components/text-field";
import { FieldDef } from "@/puck/types";

// 1. Proprietà opzionali per un JSON leggero
export interface GridProps {
  columns?: string;
  gap?: string;
  alignItems?: string;
  justifyItems?: string;
}

// 2. Default minimi (vuoti)
const defaultGrid: Record<Breakpoint, GridProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const layoutFields: FieldDef<GridProps>[] = [
  { key: "columns", label: "Columns", placeholder: "none", type: "text" },
  { key: "gap", label: "Gap", placeholder: "0", type: "unit" },
];

const alignItemsOptions = [
  { value: "start", icon: AlignStartVertical, title: "Start" },
  { value: "center", icon: AlignCenterVertical, title: "Center" },
  { value: "end", icon: AlignEndVertical, title: "End" },
  { value: "stretch", icon: StretchVertical, title: "Stretch" },
];

const justifyItemsOptions = [
  { value: "start", icon: AlignStartHorizontal, title: "Start" },
  { value: "center", icon: AlignCenterHorizontal, title: "Center" },
  { value: "end", icon: AlignEndHorizontal, title: "End" },
  { value: "stretch", icon: StretchHorizontal, title: "Stretch" },
];

const usePuck = createUsePuck();

export const GridField = withAccordionField(
  "Grid",
  <GridIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<GridProps>) => void;
    value?: Responsive<GridProps>;
  }) => {
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    const state = value || {};
    const currentValues: Partial<GridProps> = state[viewportKey] || {};

    // Il nuovo cascade recupera i valori mancanti dai breakpoint superiori
    const renderValues = cascadeViewportValues(viewportKey, state, defaultGrid);

    const update = (updates: Partial<GridProps>) => {
      onChange({
        ...state,
        [viewportKey]: {
          ...currentValues,
          ...updates,
        },
      });
    };

    const resetProp = (key: keyof GridProps) => {
      const newViewportState = { ...currentValues };
      delete newViewportState[key];

      onChange({
        ...state,
        [viewportKey]: newViewportState,
      });
    };

    return (
      <>
        {/* --- COLUMNS & GAP --- */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-1">
          {layoutFields.map((field) => (
            <InputTextField
              key={field.key}
              name={field.key}
              label={field.label}
              type={field.type}
              currentValues={currentValues}
              renderValues={renderValues}
              resetProp={resetProp}
              update={update}
            />
          ))}
        </div>

        {/* --- ALIGNMENT --- */}
        <div className="mt-4">
          <span className="text-sm font-medium">Alignment</span>
          <div className="mt-2 flex flex-col gap-y-4 rounded bg-muted/60 p-2">
            {/* Align Items */}
            <div className="flex flex-col gap-y-1">
              <PropHeader
                name="alignItems"
                label="Align items (Y)"
                isModified={currentValues.alignItems !== undefined}
                onReset={() => resetProp("alignItems")}
              />
              <SegmentedControl
                name="alignItems"
                value={renderValues.alignItems ?? "stretch"}
                onChange={(val) => update({ alignItems: val })}
                items={alignItemsOptions}
              />
            </div>

            {/* Justify Items */}
            <div className="flex flex-col gap-y-1">
              <PropHeader
                name="justifyItems"
                label="Justify items (X)"
                isModified={currentValues.justifyItems !== undefined}
                onReset={() => resetProp("justifyItems")}
              />
              <SegmentedControl
                name="justifyItems"
                value={renderValues.justifyItems ?? "stretch"}
                onChange={(val) => update({ justifyItems: val })}
                items={justifyItemsOptions}
              />
            </div>
          </div>
        </div>
      </>
    );
  },
);
