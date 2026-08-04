import { LayoutDashboardIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";

import type { SegmentedOption } from "@/puck/types";
import type { DisplayType, LayoutProps } from "../types";

import { FlexProps } from "./flex-props";
import { GridUiProps } from "./grid-props";

const defaultDisplay: Record<Breakpoint, LayoutProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const usePuck = createUsePuck();

const displayOptions = [
  { title: "Block", value: "block" },
  { title: "Flex", value: "flex" },
  { title: "Grid", value: "grid" },
  { title: "None", value: "none" },
] satisfies SegmentedOption<DisplayType>[];

const PropsComponents = {
  block: undefined,
  flex: FlexProps,
  grid: GridUiProps,
  none: undefined,
};

export const LayoutField = withAccordionField(
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

    const resetProp = (key: keyof LayoutProps) => {
      const newViewportState = { ...currentValues };
      delete newViewportState[key];

      onChange({
        ...state,
        [viewportKey]: newViewportState,
      });
    };

    const currentDisplay = renderValues.display ?? "block";
    const PropsComponent =
      PropsComponents[currentDisplay as keyof typeof PropsComponents];

    return (
      <div className="flex flex-col space-y-2 p-1">
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="display"
            label="Display"
            isModified={renderValues.display !== undefined}
            onReset={() =>
              onChange({
                ...state,
                [viewportKey]: {},
              })
            }
          />
          <SegmentedControl
            name="display"
            value={currentDisplay}
            onChange={(val: DisplayType) => {
              onChange({
                ...state,
                [viewportKey]: {
                  display: val,
                },
              });
            }}
            items={displayOptions}
          />
        </div>

        <div>
          {PropsComponent && (
            <PropsComponent
              values={renderValues}
              update={update}
              resetProp={resetProp}
            />
          )}
        </div>
      </div>
    );
  },
);
