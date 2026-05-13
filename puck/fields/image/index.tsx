import { useCallback } from "react";
import { ImageIcon, RabbitIcon, SnailIcon } from "lucide-react";
import { createUsePuck } from "@puckeditor/core";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/puck/components/segmented-control";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";

// Utility per la responsività
import { Responsive } from "@/puck/utils/responsive";
import { getViewportKey } from "@/puck/utils/viewports";
import { Breakpoint } from "@/puck/utils/breakpoints";
import { cascadeViewportValues } from "@/puck/utils/cascade-viewport-valuets";

// 1. Interfaccia con proprietà opzionali
export interface ImageProps {
  src?: string;
  alt?: string;
  href?: string;
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  loading?: "lazy" | "eager";
}

// 2. Default minimi (vuoti)
const defaultImage: Record<Breakpoint, ImageProps> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

const objectFitOptions = [
  { label: "Cover (Riempe, taglia)", value: "cover" },
  { label: "Contain (Intera)", value: "contain" },
  { label: "Fill (Deforma)", value: "fill" },
  { label: "None", value: "none" },
];

const loadingOptions = [
  { title: "Lazy", value: "lazy", icon: SnailIcon },
  { title: "Eager", value: "eager", icon: RabbitIcon },
];

const usePuck = createUsePuck();

export const ImageField = withAccordionField(
  "Image",
  <ImageIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: Responsive<ImageProps>) => void;
    value?: Responsive<ImageProps>;
  }) => {
    const currentViewport = usePuck((s) => s.appState.ui.viewports.current);
    const viewportKey = getViewportKey(currentViewport.width);

    const state = value ?? {};
    const currentValues: Partial<ImageProps> = state[viewportKey] ?? {};

    // Ereditarietà granulare tra le viewport
    const renderValues = cascadeViewportValues(
      viewportKey,
      state,
      defaultImage,
    );

    const update = useCallback(
      (updates: Partial<ImageProps>) => {
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
      (key: keyof ImageProps) => {
        const newViewportState = { ...currentValues };
        delete newViewportState[key];

        onChange({
          ...state,
          [viewportKey]: newViewportState,
        });
      },
      [onChange, state, viewportKey, currentValues],
    );

    const renderTextInput = (
      key: keyof ImageProps,
      label: string,
      placeholder?: string,
    ) => {
      const isModified = currentValues[key] !== undefined;
      return (
        <div key={`container-${key}`} className="flex flex-col gap-y-1">
          <PropHeader
            name={key}
            label={label}
            isModified={isModified}
            onReset={() => resetProp(key)}
          />
          <Input
            id={key}
            // Fallback a stringa vuota per React
            value={renderValues[key] ?? ""}
            // Salvataggio come undefined se vuoto
            onChange={(e) => update({ [key]: e.target.value || undefined })}
            placeholder={placeholder}
            className="h-8 text-sm px-2"
          />
        </div>
      );
    };

    return (
      <>
        {/* --- CONTENT --- */}
        <div className="flex flex-col gap-y-4 p-1">
          {renderTextInput("src", "Image URL", "https://...")}

          <div className="grid grid-cols-2 gap-x-4">
            {renderTextInput("alt", "Alt Text", "Descrizione...")}
            {renderTextInput("href", "Link (Opzionale)", "https://...")}
          </div>
        </div>

        {/* --- BEHAVIOR --- */}
        <div className="mt-4 p-1 flex flex-col gap-y-4">
          {/* Object Fit */}
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="objectFit"
              label="Object Fit"
              isModified={currentValues.objectFit !== undefined}
              onReset={() => resetProp("objectFit")}
            />
            <Select
              value={renderValues.objectFit ?? "cover"}
              onValueChange={(val: any) => update({ objectFit: val })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {objectFitOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Loading */}
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="loading"
              label="Loading (SEO)"
              isModified={currentValues.loading !== undefined}
              onReset={() => resetProp("loading")}
            />
            <SegmentedControl
              name="loading"
              value={renderValues.loading ?? "lazy"}
              onChange={(val: any) => update({ loading: val })}
              items={loadingOptions}
            />
          </div>
        </div>
      </>
    );
  },
);