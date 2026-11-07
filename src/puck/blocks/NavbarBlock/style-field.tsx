"use client";
import "client-only";

import { TypeIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import { FONT_SIZE_PRESETS } from "@/puck/fields/typography/presets";
import type { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import type { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { withAccordionField } from "@/puck/utils/with-accordion-field";

import type { NavbarAppearanceProps } from "./types";

const defaultAppearance: Record<Breakpoint, NavbarAppearanceProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

/**
 * Effective defaults of the stylesheet, shown as placeholders when the
 * selected breakpoint has no authored value. They mirror `puck-base.css`:
 * inline labels are 14px with an 8px gap, the mobile sheet is 16px with 4px.
 */
const getPlaceholders = (viewport: Breakpoint) =>
  viewport === "mobile"
    ? { fontSize: "16", itemSpacing: "4" }
    : { fontSize: "14", itemSpacing: "8" };

const usePuck = createUsePuck();

/**
 * Navigation style: label size and entry spacing for the NavbarBlock.
 *
 * Both values are responsive: they are authored on the viewport selected in
 * the editor toolbar, and the render resolves the desktop → tablet → mobile
 * cascade into dedicated CSS variables. The field lives here rather than in
 * the shared Typography accordion because the remaining typography controls
 * would be inert on inline navigation labels.
 */
export const NavbarStyleField = withAccordionField(
  "Navigation style",
  <TypeIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<NavbarAppearanceProps>) => void;
    value?: Responsive<NavbarAppearanceProps>;
  }) => {
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);
    const placeholders = getPlaceholders(viewportKey);

    const state = value ?? {};
    const currentValues: NavbarAppearanceProps = state[viewportKey] ?? {};

    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultAppearance,
    );

    const update = (updates: Partial<NavbarAppearanceProps>) => {
      onChange({
        ...state,
        [viewportKey]: {
          ...currentValues,
          ...updates,
        },
      });
    };

    const resetProp = (key: keyof NavbarAppearanceProps) => {
      const newViewportState = { ...currentValues };
      delete newViewportState[key];

      onChange({
        ...state,
        [viewportKey]: newViewportState,
      });
    };

    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-1">
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="fontSize"
            label="Font size"
            isModified={currentValues.fontSize !== undefined}
            onReset={() => resetProp("fontSize")}
          />
          <ValueUnitInput
            name="fontSize"
            value={renderValues.fontSize ?? ""}
            onChange={(newVal) =>
              newVal ? update({ fontSize: newVal }) : resetProp("fontSize")
            }
            placeholder={placeholders.fontSize}
            presets={FONT_SIZE_PRESETS}
          />
        </div>

        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="itemSpacing"
            label="Item spacing"
            isModified={currentValues.itemSpacing !== undefined}
            onReset={() => resetProp("itemSpacing")}
          />
          <ValueUnitInput
            name="itemSpacing"
            value={renderValues.itemSpacing ?? ""}
            onChange={(newVal) =>
              newVal
                ? update({ itemSpacing: newVal })
                : resetProp("itemSpacing")
            }
            placeholder={placeholders.itemSpacing}
          />
        </div>
      </div>
    );
  },
);
