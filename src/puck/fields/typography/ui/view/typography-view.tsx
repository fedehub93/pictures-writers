import {
  AlignCenterIcon,
  AlignJustifyIcon,
  AlignLeftIcon,
  AlignRightIcon,
  LucideIcon,
} from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import { ValueColorInput } from "@/puck/components/value-color-input";
import { SelectField } from "@/puck/components/select-input";
import { SegmentedControl } from "@/puck/components/segmented-control";

import type { TypographyProps } from "../../index";

import type { AlignType } from "../../types";
import { FONT_SIZE_PRESETS } from "../../presets";

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

interface TypographyViewProps {
  currentValues: Partial<TypographyProps>;
  renderValues: TypographyProps;
  resetProp: (key: keyof TypographyProps) => void;
  onUpdate: (values: Partial<TypographyProps>) => void;
}

export const TypographyView = ({
  currentValues,
  renderValues,
  resetProp,
  onUpdate,
}: TypographyViewProps) => {
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
        update={onUpdate}
      />

      {/* --- FONT SIZE --- */}
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="fontSize"
          label="Font Size"
          isModified={currentValues.fontSize !== undefined}
          onReset={() => resetProp("fontSize")}
        />
        <ValueUnitInput
          name="fontSize"
          value={renderValues.fontSize ?? ""}
          onChange={(newVal) => onUpdate({ fontSize: newVal ?? undefined })}
          placeholder="16"
          presets={FONT_SIZE_PRESETS}
        />
      </div>

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
        update={onUpdate}
      />

      {/* --- LETTER SPACING --- */}
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="letterSpacing"
          label="Letter Spacing"
          isModified={currentValues.letterSpacing !== undefined}
          onReset={() => resetProp("letterSpacing")}
        />
        <ValueUnitInput
          name="letterSpacing"
          value={renderValues.letterSpacing ?? ""}
          onChange={(newVal) =>
            onUpdate({ letterSpacing: newVal ?? undefined })
          }
          placeholder="normal"
          allowedKeywords={["auto", "normal"]}
        />
      </div>

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
          onChange={(val: AlignType) => onUpdate({ textAlign: val })}
          items={alignments}
        />
      </div>

      {/* --- COLOR */}
      <div
        key={`container-text-color`}
        className="flex flex-col gap-y-1 col-span-2"
      >
        <PropHeader
          key={`prop-text-color`}
          name="color"
          label="Color"
          isModified={currentValues.color !== undefined}
          onReset={() => resetProp("color")}
        />
        <ValueColorInput
          name="color"
          placeholder="currentColor"
          value={renderValues.color ?? ""}
          onChange={(newVal) => onUpdate({ color: newVal || undefined })}
        />
      </div>
    </div>
  );
};
