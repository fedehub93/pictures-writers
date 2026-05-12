import { useCallback } from "react";
import { RulerDimensionLineIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";
import { ValueUnitInput } from "@/puck/components/value-unit-input";

// Utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

export interface DimensionProps {
  width: string;
  height: string;
  maxWidth: string;
  minHeight: string;
  top: string;
  left: string;
  right: string;
  bottom: string;
  marginTop: string;
  marginLeft: string;
  marginRight: string;
  marginBottom: string;
  paddingTop: string;
  paddingLeft: string;
  paddingRight: string;
  paddingBottom: string;
}

// Creiamo un oggetto base piatto per comodità, per non ripetere il codice
const flatDefaultDimension: DimensionProps = {
  width: "",
  height: "",
  maxWidth: "",
  minHeight: "",
  top: "",
  left: "",
  right: "",
  bottom: "",
  marginTop: "",
  marginLeft: "",
  marginRight: "",
  marginBottom: "",
  paddingTop: "",
  paddingLeft: "",
  paddingRight: "",
  paddingBottom: "",
};

// Default values per ogni viewport
const defaultDimension: Record<Breakpoint, DimensionProps> = {
  desktop: { ...flatDefaultDimension },
  tablet: { ...flatDefaultDimension },
  mobile: { ...flatDefaultDimension },
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
    // A. Intercettiamo la viewport attiva
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    // B. Gestione dello stato base
    const state = value ?? {};

    // C. currentValues: i dati reali ESPLICITAMENTE salvati in questa viewport
    const currentValues: Partial<DimensionProps> = state[viewportKey] ?? {};

    // D. renderValues: il valore finale (calcolato a cascata)
    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultDimension,
    );

    // E. Funzione di aggiornamento
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

    // F. Funzione di reset
    const resetProp = useCallback(
      (key: keyof DimensionProps) => {
        const newViewportState = { ...currentValues };
        delete newViewportState[key];

        onChange({
          ...state,
          [viewportKey]: newViewportState,
        });
      },
      [onChange, state, viewportKey, currentValues],
    );

    // G. Render ottimizzato del singolo field
    const renderField = useCallback(
      ({ key, label }: FieldDef) => {
        // È modificato solo se esiste esplicitamente salvato per questo breakpoint
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
              value={renderValues[key]}
              onChange={(newVal) => update({ [key]: newVal })}
            />
          </div>
        );
      },
      [currentValues, renderValues, resetProp, update],
    );

    return (
      <>
        {/* --- LAYOUT --- */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-1">
          {layoutFields.map(renderField)}
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
