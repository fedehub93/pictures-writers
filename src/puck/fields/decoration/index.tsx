import { PaletteIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

import { DecorationView } from "./ui/view/decoration-view";

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

const defaultDecoration: Record<Breakpoint, DecorationProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

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
      <DecorationView
        currentValues={currentValues}
        renderValues={renderValues}
        resetProp={resetProp}
        onUpdate={update}
      />
    );
  },
);
