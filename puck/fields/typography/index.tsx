import { useCallback } from "react";
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
} from "@/components/ui/select";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import { SegmentedControl } from "@/puck/components/segmented-control";

// Utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

export interface TypographyProps {
  fontFamily: string;
  fontSize: string;
  fontWeight: string;
  letterSpacing: string;
  lineHeight: string;
  textAlign: "left" | "center" | "right" | "justify";
}

// Creiamo un oggetto base piatto
const flatDefaultTypography: TypographyProps = {
  fontFamily: "inherit",
  fontSize: "15px",
  fontWeight: "font-normal",
  letterSpacing: "",
  lineHeight: "normal",
  textAlign: "left",
};

// Default values per ogni viewport
const defaultTypography: Record<Breakpoint, TypographyProps> = {
  desktop: { ...flatDefaultTypography },
  tablet: { ...flatDefaultTypography },
  mobile: { ...flatDefaultTypography },
};

const alignments: {
  value: "left" | "center" | "right" | "justify";
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
    // A. Intercettiamo la viewport attiva
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    // B. Gestione dello stato base
    const state = value || defaultTypography;

    // C. currentValues: override espliciti in questa viewport
    const currentValues: Partial<TypographyProps> = state[viewportKey] || {};

    // D. renderValues: il valore calcolato a cascata da mostrare nell'interfaccia
    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultTypography,
    );

    // E. Funzione di aggiornamento mirato
    const update = useCallback(
      (updates: Partial<TypographyProps>) => {
        onChange({
          ...state,
          [viewportKey]: {
            ...currentValues,
            ...updates,
          },
        });
      },
      [onChange, state, viewportKey, currentValues],
    );

    // F. Funzione di reset mirato
    const resetProp = useCallback(
      (key: keyof TypographyProps) => {
        const newViewportState = { ...currentValues };
        delete newViewportState[key];

        onChange({
          ...state,
          [viewportKey]: newViewportState,
        });
      },
      [onChange, state, viewportKey, currentValues],
    );

    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-1">
        {/* --- FONT FAMILY --- */}
        <div>
          <PropHeader
            name="font-family"
            label="Font family"
            isModified={currentValues.fontFamily !== undefined}
            onReset={() => resetProp("fontFamily")}
          />
          <Select
            name="font-family"
            value={renderValues.fontFamily}
            onValueChange={(val) => update({ fontFamily: val })}
          >
            <SelectTrigger id="font-family" className="h-8 text-sm">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit</SelectItem>
              {/* Aggiungi qui gli altri font che supporti */}
            </SelectContent>
          </Select>
        </div>

        {/* --- FONT SIZE --- */}
        <div>
          <PropHeader
            name="font-size"
            label="Font size"
            isModified={currentValues.fontSize !== undefined}
            onReset={() => resetProp("fontSize")}
          />
          <ValueUnitInput
            name="font-size"
            value={renderValues.fontSize}
            onChange={(val) => update({ fontSize: val })}
          />
        </div>

        {/* --- FONT WEIGHT --- */}
        <div>
          <PropHeader
            name="font-weight"
            label="Font weight"
            isModified={currentValues.fontWeight !== undefined}
            onReset={() => resetProp("fontWeight")}
          />
          <Select
            name="font-weight"
            value={renderValues.fontWeight}
            onValueChange={(val) => update({ fontWeight: val })}
          >
            <SelectTrigger id="font-weight" className="h-8 text-sm">
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
        <div>
          <PropHeader
            name="letter-spacing"
            label="Letter spacing"
            isModified={currentValues.letterSpacing !== undefined}
            onReset={() => resetProp("letterSpacing")}
          />
          <ValueUnitInput
            name="letter-spacing"
            value={renderValues.letterSpacing}
            onChange={(val) => update({ letterSpacing: val })}
          />
        </div>

        {/* --- TEXT ALIGN --- */}
        <div className="col-span-2">
          <PropHeader
            name="text-align"
            label="Text align"
            isModified={currentValues.textAlign !== undefined}
            onReset={() => resetProp("textAlign")}
          />
          <SegmentedControl
            name="text-align"
            value={renderValues.textAlign}
            onChange={(val: any) => update({ textAlign: val })}
            items={alignments}
          />
        </div>
      </div>
    );
  },
);
