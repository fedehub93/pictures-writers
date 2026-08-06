import { RulerDimensionLineIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

import { DimensionView } from "./ui/view/dimension-view";

export interface DimensionProps {
  width?: string;
  height?: string;
  maxWidth?: string;
  minHeight?: string;
  aspectRatio?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  marginTop?: string;
  marginLeft?: string;
  marginRight?: string;
  marginBottom?: string;
  paddingTop?: string;
  paddingLeft?: string;
  paddingRight?: string;
  paddingBottom?: string;
}

const defaultDimension: Record<Breakpoint, DimensionProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const usePuck = createUsePuck();

export const DimensionField = withAccordionField(
  "Dimension",
  <RulerDimensionLineIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<DimensionProps>) => void;
    value?: Responsive<DimensionProps>;
  }) => {
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    const state = value ?? {};
    const currentValues: Partial<DimensionProps> = state[viewportKey] ?? {};
    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultDimension,
    );

    const update = (updates: Partial<DimensionProps>) => {
      onChange({
        ...state,
        [viewportKey]: {
          ...currentValues,
          ...updates,
        },
      });
    };

    const resetProp = (key: keyof DimensionProps) => {
      const newViewportState = { ...currentValues };
      delete newViewportState[key];

      onChange({
        ...state,
        [viewportKey]: newViewportState,
      });
    };

    return (
      <DimensionView
        currentValues={currentValues}
        renderValues={renderValues}
        resetProp={resetProp}
        onUpdate={update}
      />
    );
  },
);
