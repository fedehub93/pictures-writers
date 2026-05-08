import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  LucideIcon,
  TypeIcon,
} from "lucide-react";

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

export interface TypographyProps {
  fontFamily: string;
  fontSize: number;
  fontSizeUnit: string;
  fontWeight: string;
  letterSpacing: number;
  letterSpacingUnit: string;
  lineHeight: string;
  textAlign: "left" | "center" | "right" | "justify";
}

const defaultTypography: TypographyProps = {
  fontFamily: "inherit",
  fontSize: 15,
  fontSizeUnit: "px",
  fontWeight: "font-normal",
  letterSpacing: 0,
  letterSpacingUnit: "px",
  lineHeight: "30px",
  textAlign: "left",
};

export const TypographyField = withAccordionField(
  "Typography",
  <TypeIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: TypographyProps) => void;
    value?: TypographyProps;
  }) => {
    const state = value || defaultTypography;

    const update = (updates: Partial<TypographyProps>) => {
      onChange({
        ...state,
        ...updates,
      });
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

    return (
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-1">
        {/* --- FONT FAMILY --- */}
        <div>
          <PropHeader
            label="Font family"
            isModified={state.fontFamily !== defaultTypography.fontFamily}
            onReset={() => update({ fontFamily: defaultTypography.fontFamily })}
          />
          <Select
            value={state.fontFamily}
            onValueChange={(val) => update({ fontFamily: val })}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Select font" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="inherit">Inherit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* --- FONT SIZE --- */}
        <div>
          <PropHeader
            label="Font size"
            // Modificato se il numero o l'unità sono diversi dal default
            isModified={
              state.fontSize !== defaultTypography.fontSize ||
              state.fontSizeUnit !== defaultTypography.fontSizeUnit
            }
            onReset={() =>
              update({
                fontSize: defaultTypography.fontSize,
                fontSizeUnit: defaultTypography.fontSizeUnit,
              })
            }
          />
          <ValueUnitInput
            value={state.fontSize}
            onValueChange={(val) => update({ fontSize: val })}
            unit={state.fontSizeUnit}
            onUnitChange={(val) => update({ fontSizeUnit: val })}
          />
        </div>

        {/* --- FONT WEIGHT --- */}
        <div>
          <PropHeader
            label="Font weight"
            isModified={state.fontWeight !== defaultTypography.fontWeight}
            onReset={() => update({ fontWeight: defaultTypography.fontWeight })}
          />
          <Select
            value={state.fontWeight}
            onValueChange={(val) => update({ fontWeight: val })}
          >
            <SelectTrigger className="h-8 text-sm">
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
            label="Letter spacing"
            isModified={
              state.letterSpacing !== defaultTypography.letterSpacing ||
              state.letterSpacingUnit !== defaultTypography.letterSpacingUnit
            }
            onReset={() =>
              update({
                letterSpacing: defaultTypography.letterSpacing,
                letterSpacingUnit: defaultTypography.letterSpacingUnit,
              })
            }
          />
          <ValueUnitInput
            value={state.letterSpacing}
            onValueChange={(val) => update({ letterSpacing: val })}
            unit={state.letterSpacingUnit}
            onUnitChange={(val) => update({ letterSpacingUnit: val })}
          />
        </div>

        <div>
          <PropHeader
            label="Text align"
            isModified={state.textAlign !== defaultTypography.textAlign}
            onReset={() => update({ textAlign: defaultTypography.textAlign })}
          />
          <SegmentedControl
            value={state.textAlign}
            onChange={(val) => update({ textAlign: val })}
            items={alignments}
          />
        </div>
      </div>
    );
  },
);
