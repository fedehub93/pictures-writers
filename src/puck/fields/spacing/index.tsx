import { SquareDashedIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";
import type { Field } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

import { SpacingView } from "./ui/view/spacing-view";

export interface SpacingProps {
  marginTop?: string;
  marginRight?: string;
  marginBottom?: string;
  marginLeft?: string;
  paddingTop?: string;
  paddingRight?: string;
  paddingBottom?: string;
  paddingLeft?: string;
}

const defaultSpacing: Record<Breakpoint, SpacingProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const usePuck = createUsePuck();

/**
 * Default spacing editor: the four margins and the four paddings, as two
 * labelled groups.
 *
 * It is a peer of the Size field and follows the same responsive contract: one
 * state per Breakpoint, a reset per property, and values cascading from the
 * wider Breakpoint.
 */
export const SpacingField: Field = withAccordionField(
  "Spacing",
  <SquareDashedIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<SpacingProps>) => void;
    value?: Responsive<SpacingProps>;
  }) => {
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    const state = value ?? {};
    const currentValues: Partial<SpacingProps> = state[viewportKey] ?? {};
    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultSpacing,
    );

    const update = (updates: Partial<SpacingProps>) => {
      onChange({
        ...state,
        [viewportKey]: {
          ...currentValues,
          ...updates,
        },
      });
    };

    const resetProp = (key: keyof SpacingProps) => {
      const newViewportState = { ...currentValues };
      delete newViewportState[key];

      onChange({
        ...state,
        [viewportKey]: newViewportState,
      });
    };

    return (
      <SpacingView
        currentValues={currentValues}
        renderValues={renderValues}
        resetProp={resetProp}
        onUpdate={update}
      />
    );
  },
);
