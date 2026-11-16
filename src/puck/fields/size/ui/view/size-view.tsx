import type { FieldDef } from "@/puck/types";

import { cn } from "@/shared/lib/utils";

import { PANEL_CONTROL, PanelSelectTrigger } from "@/puck/components/panel-control";
import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import type { ValueUnitPreset } from "@/puck/components/value-unit-input/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";

import type { SizeProps } from "../../index";
import { getWidthPresets } from "../../presets";

/** A field row that can also feed the value/unit input's own options. */
type SizeRow = FieldDef<SizeProps> & {
  presets?: ValueUnitPreset[];
  allowedKeywords?: string[];
};

const getSizeRows = (
  inheritedWidth?: string,
  baseWidth?: string,
): SizeRow[] => [
  {
    key: "width",
    label: "Width",
    type: "unit",
    placeholder: "auto",
    // Width names the states the style layer can imply, so the author can pick
    // *Fill* and *Fit content* without knowing CSS.
    presets: getWidthPresets(inheritedWidth, baseWidth),
    allowedKeywords: ["auto", "fit-content"],
  },
  { key: "height", label: "Height", type: "unit", placeholder: "auto" },
  { key: "maxWidth", label: "Max width", type: "unit", placeholder: "auto" },
  { key: "minHeight", label: "Min height", type: "unit", placeholder: "auto" },
];

const aspectRatioOptions = [
  { value: "auto", label: "Auto (Default)" },
  { value: "1 / 1", label: "1:1 (Square)" },
  { value: "4 / 3", label: "4:3 (Classic)" },
  { value: "16 / 9", label: "16:9 (Wide)" },
  { value: "21 / 9", label: "21:9 (Cinematic)" },
  { value: "9 / 16", label: "9:16 (Vertical)" },
];

interface SizeViewProps {
  currentValues: Partial<SizeProps>;
  renderValues: SizeProps;
  resetProp: (key: keyof SizeProps) => void;
  onUpdate: (values: Partial<SizeProps>) => void;
  /** The width the block resolves to when nothing is authored. */
  baseWidth?: string;
}

export const SizeView = ({
  currentValues,
  renderValues,
  resetProp,
  onUpdate,
  baseWidth,
}: SizeViewProps) => {
  const isAspectRatioModified = currentValues.aspectRatio !== undefined;
  const currentRatioValue = renderValues.aspectRatio;

  const isCustomRatio =
    currentRatioValue !== "" &&
    !aspectRatioOptions.some((opt) => opt.value === currentRatioValue);

  const selectValue = isCustomRatio ? "custom" : currentRatioValue || "auto";

  // An empty width at this breakpoint means "inherit": say what it inherits or,
  // when nothing is inherited, what the block falls back to, so Auto does not
  // read as a reset for the whole ladder.
  const ownWidth = currentValues.width?.trim();
  const inheritedWidth = ownWidth
    ? undefined
    : renderValues.width?.trim() || undefined;

  const sizeRows = getSizeRows(inheritedWidth, baseWidth);

  return (
    <div className="flex flex-col gap-y-2 p-1">
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-1">
        {sizeRows.map((field) => {
          const isModified = currentValues[field.key] !== undefined;
          const displayValue = renderValues[field.key] ?? "";
          return (
            <div key={field.key} className="flex flex-col gap-y-1">
              <PropHeader
                name={field.key}
                label={field.label}
                isModified={isModified}
                onReset={() => resetProp(field.key)}
              />
              <ValueUnitInput
                name={field.key}
                value={displayValue}
                onChange={(newVal) =>
                  onUpdate({ [field.key]: newVal || undefined })
                }
                placeholder={field.placeholder}
                presets={field.presets}
                allowedKeywords={field.allowedKeywords}
              />
            </div>
          );
        })}

        <div className="col-span-2 flex flex-col gap-y-1">
          <PropHeader
            name="aspectRatio"
            label="Aspect ratio"
            isModified={isAspectRatioModified}
            onReset={() => resetProp("aspectRatio")}
          />

          <div className="flex gap-x-2">
            <Select
              value={selectValue}
              onValueChange={(val) => {
                if (val === "custom") {
                  onUpdate({ aspectRatio: "2 / 1" });
                } else {
                  onUpdate({ aspectRatio: val === "auto" ? "" : val });
                }
              }}
            >
              <PanelSelectTrigger className="flex-1">
                <SelectValue placeholder="Auto" />
              </PanelSelectTrigger>
              <SelectContent>
                {aspectRatioOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom...</SelectItem>
              </SelectContent>
            </Select>

            {isCustomRatio && (
              <Input
                className={cn(PANEL_CONTROL.box, "w-1/2")}
                value={currentRatioValue}
                onChange={(e) => onUpdate({ aspectRatio: e.target.value })}
                placeholder="es. 3 / 2"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
