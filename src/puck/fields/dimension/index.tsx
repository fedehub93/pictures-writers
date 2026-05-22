import { useCallback } from "react";
import { RulerDimensionLineIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";

// Utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

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

type FieldDef = { key: keyof DimensionProps; label: string };

const layoutFields: FieldDef[] = [
  { key: "width", label: "Width" },
  { key: "height", label: "Height" },
  { key: "maxWidth", label: "Max width" },
  { key: "minHeight", label: "Min height" },
];

const marginFields: FieldDef[] = [
  { key: "marginTop", label: "Top" },
  { key: "marginRight", label: "Right" },
  { key: "marginBottom", label: "Bottom" },
  { key: "marginLeft", label: "Left" },
];

const paddingFields: FieldDef[] = [
  { key: "paddingTop", label: "Top" },
  { key: "paddingRight", label: "Right" },
  { key: "paddingBottom", label: "Bottom" },
  { key: "paddingLeft", label: "Left" },
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

    const update = useCallback(
      (updates: Partial<DimensionProps>) => {
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

    const resetProp = useCallback(
      (key: keyof DimensionProps) => {
        const newViewportState = { ...currentValues };
        delete newViewportState[key]; // Rimuovendo la chiave, Puck non la salverà nel JSON

        onChange({
          ...state,
          [viewportKey]: newViewportState,
        });
      },
      [onChange, state, viewportKey, currentValues],
    );

    // Render ottimizzato del singolo field (usato per le dimensioni con ValueUnitInput)
    const renderField = useCallback(
      ({ key, label }: FieldDef) => {
        const isModified = currentValues[key] !== undefined;

        return (
          <div key={`container-${key}`} className="flex flex-col gap-y-1">
            <PropHeader
              key={`prop-${key}`}
              name={key}
              label={label}
              isModified={isModified}
              onReset={() => resetProp(key)}
            />
            <ValueUnitInput
              key={`value-${key}`}
              name={key}
              value={renderValues[key] ?? ""}
              onChange={(newVal) => update({ [key]: newVal || undefined })}
            />
          </div>
        );
      },
      [currentValues, renderValues, resetProp, update],
    );

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
          {layoutFields.map(renderField)}

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
                <SelectTrigger className="h-8 text-sm flex-1">
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
                  className="h-8 text-sm w-1/2"
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
            {marginFields.map(renderField)}
          </div>
        </div>

        {/* --- PADDING --- */}
        <div className="mt-4">
          <span className="text-sm font-medium">Padding</span>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-4 p-2 bg-muted/60 rounded">
            {paddingFields.map(renderField)}
          </div>
        </div>
      </>
    );
  },
);
