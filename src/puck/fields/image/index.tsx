import { useCallback } from "react";
import { ImageIcon, RabbitIcon, SnailIcon } from "lucide-react";

import { Input } from "@/shared/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { SegmentedControl } from "@/puck/components/segmented-control";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { PropHeader } from "@/puck/components/prop-header";

export interface ImageProps {
  src?: string;
  alt?: string;
  href?: string;
  objectFit?: "fill" | "contain" | "cover" | "none" | "scale-down";
  loading?: "lazy" | "eager";
}

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

export const ImageField = withAccordionField(
  "Image",
  <ImageIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: ImageProps) => void;
    value?: ImageProps;
  }) => {
    const state = value ?? {};

    const update = useCallback(
      (updates: Partial<ImageProps>) => {
        onChange({
          ...state,
          ...updates,
        });
      },
      [onChange, state],
    );

    const resetProp = useCallback(
      (key: keyof ImageProps) => {
        const newState = { ...state };
        delete newState[key];

        // Salviamo il nuovo stato da cui abbiamo rimosso la chiave
        onChange(newState);
      },
      [onChange, state],
    );

    const renderTextInput = (
      key: keyof ImageProps,
      label: string,
      placeholder?: string,
    ) => {
      const isModified = state[key] !== undefined;
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
            // Fallback a stringa vuota per evitare warning di React
            value={state[key] ?? ""}
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
              isModified={state.objectFit !== undefined}
              onReset={() => resetProp("objectFit")}
            />
            <Select
              value={state.objectFit ?? "cover"}
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
              isModified={state.loading !== undefined}
              onReset={() => resetProp("loading")}
            />
            <SegmentedControl
              name="loading"
              value={state.loading ?? "lazy"}
              onChange={(val: any) => update({ loading: val })}
              items={loadingOptions}
            />
          </div>
        </div>
      </>
    );
  },
);
