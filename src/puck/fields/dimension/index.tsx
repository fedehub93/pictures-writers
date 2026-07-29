import { RulerDimensionLineIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";

// Utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";
import { InputTextField } from "@/puck/components/text-field";
import { FieldDef } from "@/puck/types";

export interface DimensionProps {
  width?: string;
  height?: string;
  maxWidth?: string;
  minHeight?: string;
  aspectRatio?: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  marginTop?: string;
  marginLeft?: string;
  marginRight?: string;
  marginBottom?: string;
  paddingTop?: string;
  paddingLeft?: string;
  paddingRight?: string;
  paddingBottom?: string;
}

const defaultDimension: Record<Breakpoint, DimensionProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const layoutFields: FieldDef<DimensionProps>[] = [
  { key: "width", label: "Width", type: "unit", placeholder: "auto" },
  { key: "height", label: "Height", type: "unit", placeholder: "auto" },
  { key: "maxWidth", label: "Max width", type: "unit", placeholder: "none" },
  { key: "minHeight", label: "Min height", type: "unit", placeholder: "none" },
];

const marginFields: FieldDef<DimensionProps>[] = [
  { key: "marginTop", label: "Top", type: "unit", placeholder: "0" },
  { key: "marginRight", label: "Right", type: "unit", placeholder: "0" },
  { key: "marginBottom", label: "Bottom", type: "unit", placeholder: "0" },
  { key: "marginLeft", label: "Left", type: "unit", placeholder: "0" },
];

const paddingFields: FieldDef<DimensionProps>[] = [
  { key: "paddingTop", label: "Top", type: "unit", placeholder: "0" },
  { key: "paddingRight", label: "Right", type: "unit", placeholder: "0" },
  { key: "paddingBottom", label: "Bottom", type: "unit", placeholder: "0" },
  { key: "paddingLeft", label: "Left", type: "unit", placeholder: "0" },
];

// Array di opzioni predefinite per l'aspect ratio
const aspectRatioOptions = [
  { value: "auto", label: "Auto (Default)" },
  { value: "1 / 1", label: "1:1 (Square)" },
  { value: "4 / 3", label: "4:3 (Classic)" },
  { value: "16 / 9", label: "16:9 (Wide)" },
  { value: "21 / 9", label: "21:9 (Cinematic)" },
  { value: "9 / 16", label: "9:16 (Vertical)" },
];

const usePuck = createUsePuck();

export const DimensionField = withAccordionField(
  "Dimension",
  <RulerDimensionLineIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<DimensionProps>) => void;
    value?: Responsive<DimensionProps>;
  }) => {
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    const state = value ?? {};
    const currentValues: Partial<DimensionProps> = state[viewportKey] ?? {};
    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultDimension,
    );

    const update = (updates: Partial<DimensionProps>) => {
      onChange({
        ...state,
        [viewportKey]: {
          ...currentValues,
          ...updates,
        },
      });
    };

    const resetProp = (key: keyof DimensionProps) => {
      const newViewportState = { ...currentValues };
      delete newViewportState[key]; // Rimuovendo la chiave, Puck non la salverà nel JSON

      onChange({
        ...state,
        [viewportKey]: newViewportState,
      });
    };

    // --- Gestione specifica dell'Aspect Ratio ---
    const isAspectRatioModified = currentValues.aspectRatio !== undefined;
    const currentRatioValue = renderValues.aspectRatio;

    // Controlliamo se il valore salvato è uno dei preset.
    // Se non lo è e non è vuoto, vuol dire che l'utente ha inserito un valore "Custom".
    const isCustomRatio =
      currentRatioValue !== "" &&
      !aspectRatioOptions.some((opt) => opt.value === currentRatioValue);

    // Il SelectMostra "custom" se il valore non è nei preset
    const selectValue = isCustomRatio ? "custom" : currentRatioValue || "auto";

    return (
      <>
        {/* --- LAYOUT --- */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-1">
          {layoutFields.map((field) => (
            <InputTextField
              key={field.key}
              name={field.key}
              label={field.label}
              placeholder={field.placeholder}
              type={field.type}
              currentValues={currentValues}
              renderValues={renderValues}
              resetProp={resetProp}
              update={update}
            />
          ))}

          {/* Render dedicato per Aspect Ratio che occupa 2 colonne */}
          <div className="col-span-2 flex flex-col gap-y-1">
            <PropHeader
              name="aspectRatio"
              label="Aspect Ratio"
              isModified={isAspectRatioModified}
              onReset={() => resetProp("aspectRatio")}
            />

            <div className="flex gap-x-2">
              <Select
                value={selectValue}
                onValueChange={(val) => {
                  if (val === "custom") {
                    // Impostiamo un valore custom temporaneo se seleziona "Custom"
                    update({ aspectRatio: "2 / 1" });
                  } else {
                    update({ aspectRatio: val === "auto" ? "" : val });
                  }
                }}
              >
                <SelectTrigger className="h-8 text-xs flex-1">
                  <SelectValue placeholder="Auto" />
                </SelectTrigger>
                <SelectContent>
                  {aspectRatioOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>

              {/* Mostra l'input manuale solo se l'utente ha selezionato "Custom" */}
              {isCustomRatio && (
                <Input
                  className="h-8 text-xs w-1/2 placeholder:text-xs"
                  value={currentRatioValue}
                  onChange={(e) => update({ aspectRatio: e.target.value })}
                  placeholder="es. 3 / 2"
                />
              )}
            </div>
          </div>
        </div>

        {/* --- MARGIN --- */}
        <div className="mt-4">
          <span className="text-sm font-medium">Margin</span>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
            {marginFields.map((field) => (
              <InputTextField
                key={field.key}
                name={field.key}
                label={field.label}
                placeholder={field.placeholder}
                type={field.type}
                currentValues={currentValues}
                renderValues={renderValues}
                resetProp={resetProp}
                update={update}
              />
            ))}
          </div>
        </div>

        {/* --- PADDING --- */}
        <div className="mt-4">
          <span className="text-sm font-medium">Padding</span>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
            {paddingFields.map((field) => (
              <InputTextField
                key={field.key}
                name={field.key}
                label={field.label}
                placeholder={field.placeholder}
                type={field.type}
                currentValues={currentValues}
                renderValues={renderValues}
                resetProp={resetProp}
                update={update}
              />
            ))}
          </div>
        </div>
      </>
    );
  },
);
