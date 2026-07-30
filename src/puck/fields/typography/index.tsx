import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  LucideIcon,
  TypeIcon,
} from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";

import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import { InputTextField } from "@/puck/components/text-field";
import { SelectField } from "@/puck/components/select-field";
import { FONT_SIZE_PRESETS } from "./presets";

type AlignType = "left" | "center" | "right" | "justify";

export interface TypographyProps {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  letterSpacing?: string;
  lineHeight?: string;
  textAlign?: AlignType;
}

// 2. Default minimi (vuoti)
const defaultTypography: Record<Breakpoint, TypographyProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const weightOptions = ["300", "400", "500", "600", "700", "800"];

const alignments: {
  value: AlignType;
  icon: LucideIcon;
  title: string;
}[] = [
  { value: "left", icon: AlignLeftIcon, title: "Left" },
  { value: "center", icon: AlignCenterIcon, title: "Center" },
  { value: "right", icon: AlignRightIcon, title: "Right" },
  { value: "justify", icon: AlignJustifyIcon, title: "Justify" },
];

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

    // Il cascade recupera i valori mancanti dai breakpoint superiori
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
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-1">
        {/* --- FONT FAMILY --- */}
        <SelectField
          key="fontFamily"
          name="fontFamily"
          label="Font Family"
          placeholder="inherit"
          options={["inherit"]}
          currentValues={currentValues}
          renderValues={renderValues}
          resetProp={resetProp}
          update={update}
        />

        {/* --- FONT SIZE --- */}
        <InputTextField
          key="fontSize"
          name="fontSize"
          label="Font Size"
          placeholder="16"
          type="unit"
          currentValues={currentValues}
          renderValues={renderValues}
          resetProp={resetProp}
          update={update}
          presets={FONT_SIZE_PRESETS}
        />

        {/* --- FONT WEIGHT --- */}
        <SelectField
          key="fontWeight"
          name="fontWeight"
          label="Font Weight"
          placeholder="normal"
          options={weightOptions}
          currentValues={currentValues}
          renderValues={renderValues}
          resetProp={resetProp}
          update={update}
        />

        {/* --- LETTER SPACING --- */}
        <InputTextField
          key="letterSpacing"
          name="letterSpacing"
          label="Letter Spacing"
          placeholder="normal"
          type="unit"
          currentValues={currentValues}
          renderValues={renderValues}
          resetProp={resetProp}
          update={update}
        />

        {/* --- TEXT ALIGN --- */}
        <div className="flex flex-col gap-y-1 col-span-2">
          <PropHeader
            name="textAlign"
            label="Text align"
            isModified={currentValues.textAlign !== undefined}
            onReset={() => resetProp("textAlign")}
          />
          <SegmentedControl
            name="textAlign"
            value={renderValues.textAlign ?? "left"}
            onChange={(val: AlignType) => update({ textAlign: val })}
            items={alignments}
          />
        </div>
      </div>
    );
  },
);
