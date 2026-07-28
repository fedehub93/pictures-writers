import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  LucideIcon,
  TypeIcon,
} from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";
import { SegmentedControl } from "@/puck/components/segmented-control";

// Utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import { InputTextField } from "@/puck/components/text-field";

// 1. Interfaccia con proprietà opzionali per un JSON leggero
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

const alignments: {
  value: AlignType;
  icon: LucideIcon;
  title: string;
}[] = [
  { value: "left", icon: AlignLeft, title: "Left" },
  { value: "center", icon: AlignCenter, title: "Center" },
  { value: "right", icon: AlignRight, title: "Right" },
  { value: "justify", icon: AlignJustify, title: "Justify" },
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
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="fontFamily"
            label="Font family"
            isModified={currentValues.fontFamily !== undefined}
            onReset={() => resetProp("fontFamily")}
          />
          <Select
            name="fontFamily"
            value={renderValues.fontFamily ?? "inherit"}
            onValueChange={(val) =>
              update({ fontFamily: val === "inherit" ? undefined : val })
            }
          >
            <SelectTrigger id="font-family" className="h-8 text-xs">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit</SelectItem>
              {/* Aggiungi qui gli altri font */}
            </SelectContent>
          </Select>
        </div>

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
        />

        {/* --- FONT WEIGHT --- */}

        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="fontWeight"
            label="Font weight"
            isModified={currentValues.fontWeight !== undefined}
            onReset={() => resetProp("fontWeight")}
          />
          <Select
            name="fontWeight"
            value={renderValues.fontWeight ?? "font-normal"}
            onValueChange={(val) => update({ fontWeight: val })}
          >
            <SelectTrigger id="font-weight" className="h-8 text-xs">
              <SelectValue placeholder="Select weight" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="font-light">Light (300)</SelectItem>
              <SelectItem value="font-normal">Normal (400)</SelectItem>
              <SelectItem value="font-medium">Medium (500)</SelectItem>
              <SelectItem value="font-bold">Bold (700)</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
