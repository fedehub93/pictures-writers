import { RulerDimensionLineIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";
import type { Field } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

import { SizeView } from "./ui/view/size-view";

export interface SizeProps {
  width?: string;
  height?: string;
  maxWidth?: string;
  minHeight?: string;
  aspectRatio?: string;
}

const defaultSize: Record<Breakpoint, SizeProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const usePuck = createUsePuck();

interface SizeFieldOptions {
  /**
   * The width the block resolves to when no width is authored: its natural
   * size. Blocks that are content-sized by nature declare it here, and their
   * render passes the same constant to `getSizeVars`, so the panel and the box
   * read one value.
   */
  baseWidth?: string;
}

export const createSizeField = ({ baseWidth }: SizeFieldOptions = {}): Field =>
  withAccordionField(
    "Size",
    <RulerDimensionLineIcon className="size-4 text-muted-foreground" />,
    ({
      onChange,
      value,
    }: {
      onChange: (value: Responsive<SizeProps>) => void;
      value?: Responsive<SizeProps>;
    }) => {
      const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
      const viewportKey = getViewportKey(currentViewport.width);

      const state = value ?? {};
      const currentValues: Partial<SizeProps> = state[viewportKey] ?? {};
      const renderValues = cascadeViewportValues(viewportKey, state, defaultSize);

      const update = (updates: Partial<SizeProps>) => {
        onChange({
          ...state,
          [viewportKey]: {
            ...currentValues,
            ...updates,
          },
        });
      };

      const resetProp = (key: keyof SizeProps) => {
        const newViewportState = { ...currentValues };
        delete newViewportState[key];

        onChange({
          ...state,
          [viewportKey]: newViewportState,
        });
      };

      return (
        <SizeView
          currentValues={currentValues}
          renderValues={renderValues}
          resetProp={resetProp}
          onUpdate={update}
          baseWidth={baseWidth}
        />
      );
    },
  );

/**
 * Default size editor: width, height, max width, min height and aspect ratio.
 * Blocks with a natural width use `createSizeField({ baseWidth })`.
 */
export const SizeField: Field = createSizeField();
