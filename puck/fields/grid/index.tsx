import { useCallback } from "react";
import {
  GridIcon,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  StretchVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  StretchHorizontal,
} from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/puck/components/segmented-control";
import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";

// Importiamo le nostre utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { ValueUnitInput } from "@/puck/components/value-unit-input";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

// 1. Interfaccia completa per la griglia
export interface GridProps {
  columns: string;
  gap: string;
  alignItems: string;
  justifyItems: string;
}

// Creiamo un oggetto base piatto per i default
const flatDefaultGrid: GridProps = {
  columns: "",
  gap: "",
  alignItems: "stretch",
  justifyItems: "stretch",
};

// 2. Default values per ogni viewport
const defaultGrid: Record<Breakpoint, GridProps> = {
  desktop: { ...flatDefaultGrid },
  tablet: { ...flatDefaultGrid },
  mobile: { ...flatDefaultGrid },
};

// Configurazioni per i campi testuali
type FieldDef = { key: keyof GridProps; label: string; type?: string };
const layoutFields: FieldDef[] = [
  { key: "columns", label: "Columns (es. 1fr 1fr)" },
  { key: "gap", label: "Gap (es. 16px)", type: "unit" },
];

// Configurazioni per i SegmentedControl
const alignItemsOptions = [
  { value: "start", icon: AlignStartVertical, title: "Start" },
  { value: "center", icon: AlignCenterVertical, title: "Center" },
  { value: "end", icon: AlignEndVertical, title: "End" },
  { value: "stretch", icon: StretchVertical, title: "Stretch" },
];

const justifyItemsOptions = [
  { value: "start", icon: AlignStartHorizontal, title: "Start" },
  { value: "center", icon: AlignCenterHorizontal, title: "Center" },
  { value: "end", icon: AlignEndHorizontal, title: "End" },
  { value: "stretch", icon: StretchHorizontal, title: "Stretch" },
];

const usePuck = createUsePuck();

export const GridField = withAccordionField(
  "Grid",
  <GridIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<GridProps>) => void;
    value?: Responsive<GridProps>;
  }) => {
    // A. Intercettiamo la viewport attiva
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    // B. Gestione dello stato base
    const state = value || defaultGrid;

    // C. currentValues: i dati reali ESPLICITAMENTE salvati in questa viewport
    const currentValues: Partial<GridProps> = state[viewportKey] || {};

    // D. renderValues: il valore finale (calcolato a cascata)
    const renderValues = cascadeViewportValues(viewportKey, state, defaultGrid);

    // E. Funzione di aggiornamento
    const update = useCallback(
      (updates: Partial<GridProps>) => {
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
      (key: keyof GridProps) => {
        const newViewportState = { ...currentValues };
        delete newViewportState[key];

        onChange({
          ...state,
          [viewportKey]: newViewportState,
        });
      },
      [onChange, state, viewportKey, currentValues],
    );

    // G. Helper per renderizzare i campi testuali velocemente
    const renderTextInput = useCallback(
      ({ key, label, type }: FieldDef) => {
        // È modificato ESPLICITAMENTE in questa viewport?
        const isModified = currentValues[key] !== undefined;

        return (
          <div key={`container-${key}`} className="flex flex-col gap-y-1">
            <PropHeader
              name={key}
              label={label}
              isModified={isModified}
              onReset={() => resetProp(key)}
            />
            {type === "unit" ? (
              <ValueUnitInput
                key={key}
                name={key}
                value={renderValues[key]}
                onChange={(newVal) => update({ [key]: newVal })}
              />
            ) : (
              <Input
                id={key}
                value={renderValues[key]}
                onChange={(e) => update({ [key]: e.target.value })}
                className="h-8 text-sm px-2"
              />
            )}
          </div>
        );
      },
      [renderValues, currentValues, update, resetProp],
    );

    return (
      <>
        {/* --- COLUMNS & GAP --- */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-1">
          {layoutFields.map(renderTextInput)}
        </div>

        {/* --- ALIGNMENT --- */}
        <div className="mt-4">
          <span className="text-sm font-medium">Alignment</span>
          <div className="mt-2 flex flex-col gap-y-4 p-2 bg-muted/60 rounded">
            {/* Align Items (Verticale) */}
            <div className="flex flex-col gap-y-1">
              <PropHeader
                name="alignItems"
                label="Align items (Y)"
                isModified={currentValues.alignItems !== undefined}
                onReset={() => resetProp("alignItems")}
              />
              <SegmentedControl
                name="alignItems"
                value={renderValues.alignItems}
                onChange={(val) => update({ alignItems: val })}
                items={alignItemsOptions}
              />
            </div>

            {/* Justify Items (Orizzontale) */}
            <div className="flex flex-col gap-y-1">
              <PropHeader
                name="justifyItems"
                label="Justify items (X)"
                isModified={currentValues.justifyItems !== undefined}
                onReset={() => resetProp("justifyItems")}
              />
              <SegmentedControl
                name="justifyItems"
                value={renderValues.justifyItems}
                onChange={(val) => update({ justifyItems: val })}
                items={justifyItemsOptions}
              />
            </div>
          </div>
        </div>
      </>
    );
  },
);
