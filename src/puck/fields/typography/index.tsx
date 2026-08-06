import { TypeIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

import { TypographyView } from "./ui/view/typography-view";
import type { AlignType } from "./types";

export interface TypographyProps {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: AlignType;
  color?: string;
}

const defaultTypography: Record<Breakpoint, TypographyProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const usePuck = createUsePuck();

export const TypographyField = withAccordionField(
  "Typography",
  <TypeIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<TypographyProps>) => void;
    value?: Responsive<TypographyProps>;
  }) => {
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    const state = value || {};
    const currentValues: Partial<TypographyProps> = state[viewportKey] || {};

    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultTypography,
    );

    const update = (updates: Partial<TypographyProps>) => {
      onChange({
        ...state,
        [viewportKey]: {
          ...currentValues,
          ...updates,
        },
      });
    };

    const resetProp = (key: keyof TypographyProps) => {
      const newViewportState = { ...currentValues };
      delete newViewportState[key];

      onChange({
        ...state,
        [viewportKey]: newViewportState,
      });
    };

    return (
      <TypographyView
        currentValues={currentValues}
        renderValues={renderValues}
        resetProp={resetProp}
        onUpdate={update}
      />
    );
  },
);
