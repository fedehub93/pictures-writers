import { LayoutDashboardIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

import { LayoutView } from "./ui/view/layout";
import type {
  AlignItems,
  DisplayType,
  FlexDirection,
  JustifyContent,
} from "./types";

export interface LayoutProps {
  display?: DisplayType;
  flexDirection?: FlexDirection;
  flexWrap?: string;
  justifyContent?: JustifyContent;
  alignItems?: AlignItems;
  alignContent?: string;
  justifyItems?: string;
  alignSelf?: string;
  rowGap?: string;
  columnGap?: string;
  gridTemplateColumns?: string;
  gridTemplateRows?: string;
}

const defaultDisplay: Record<Breakpoint, LayoutProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const usePuck = createUsePuck();

interface LayoutFieldOptions {
  /**
   * Blocks without children only expose the display control: flex and grid
   * settings could not have an effect on them.
   */
  showContainerControls?: boolean;
}

const createLayoutField = ({
  showContainerControls = true,
}: LayoutFieldOptions = {}) =>
  withAccordionField(
    "Layout",
    <LayoutDashboardIcon className="size-4 text-muted-foreground" />,
    ({
      onChange,
      value,
    }: {
      onChange: (value: Responsive<LayoutProps>) => void;
      value?: Responsive<LayoutProps>;
    }) => {
      const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
      const viewportKey = getViewportKey(currentViewport.width);

      const state = value ?? {};
      const currentValues: Partial<LayoutProps> = state[viewportKey] ?? {};
      const renderValues = cascadeViewportValues(
        viewportKey,
        state,
        defaultDisplay,
      );

      const update = (updates: Partial<LayoutProps>) => {
        onChange({
          ...state,
          [viewportKey]: {
            ...currentValues,
            ...updates,
          },
        });
      };

      const updateDisplay = (display?: DisplayType) => {
        onChange({
          ...state,
          [viewportKey]: {
            display,
          },
        });
      };

      const resetProp = (key: keyof LayoutProps) => {
        const newViewportState = { ...currentValues };
        delete newViewportState[key];

        onChange({
          ...state,
          [viewportKey]: newViewportState,
        });
      };

      return (
        <LayoutView
          currentValues={currentValues}
          renderValues={renderValues}
          resetProp={resetProp}
          onUpdateDisplay={updateDisplay}
          onUpdate={update}
          showContainerControls={showContainerControls}
        />
      );
    },
  );

/**
 * Layout field for blocks that contain other blocks (Container, Flex, Grid and
 * the Top bar slot): display, flex and grid controls.
 */
export const LayoutField = createLayoutField();

/**
 * Layout field for leaf blocks: the display control only, so responsive
 * visibility is available everywhere without exposing controls that could not
 * have an effect.
 */
export const DisplayOnlyLayoutField = createLayoutField({
  showContainerControls: false,
});
