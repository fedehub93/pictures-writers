import {
  type LucideIcon,
  ImageIcon,
  RabbitIcon,
  SnailIcon,
} from "lucide-react";

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
import { InputTextField } from "@/puck/components/text-field";

type ObjectFitType = "fill" | "contain" | "cover" | "none" | "scale-down";
type LoadingType = "lazy" | "eager";

export interface ImageProps {
  src?: string;
  alt?: string;
  href?: string;
  objectFit?: ObjectFitType;
  loading?: LoadingType;
}

type FitOptionsType = {
  label: string;
  value: ObjectFitType;
};

const objectFitOptions = [
  { label: "Cover", value: "cover" },
  { label: "Contain", value: "contain" },
  { label: "Fill ", value: "fill" },
  { label: "None", value: "none" },
] satisfies FitOptionsType[];

type LoadingOptionsType = {
  title: string;
  value: LoadingType;
  icon: LucideIcon;
};

const loadingOptions = [
  { title: "Lazy", value: "lazy", icon: SnailIcon },
  { title: "Eager", value: "eager", icon: RabbitIcon },
] satisfies LoadingOptionsType[];

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

    const update = (updates: Partial<ImageProps>) => {
      onChange({
        ...state,
        ...updates,
      });
    };

    const resetProp = (key: keyof ImageProps) => {
      const newState = { ...state };
      delete newState[key];

      // Salviamo il nuovo stato da cui abbiamo rimosso la chiave
      onChange(newState);
    };

    return (
      <>
        {/* --- CONTENT --- */}
        <div className="flex flex-col gap-y-4 p-1">
          <InputTextField
            key="src"
            name="src"
            label="Image URL"
            currentValues={state}
            renderValues={state}
            resetProp={resetProp}
            update={update}
          />

          <div className="grid grid-cols-2 gap-x-4">
            <InputTextField
              key="alt"
              name="alt"
              label="Alt Text"
              currentValues={state}
              renderValues={state}
              resetProp={resetProp}
              update={update}
            />
            <InputTextField
              key="href"
              name="href"
              label="Link (Opzionale)"
              currentValues={state}
              renderValues={state}
              resetProp={resetProp}
              update={update}
            />
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
              onValueChange={(val: ObjectFitType) => update({ objectFit: val })}
            >
              <SelectTrigger className="h-8 text-xs">
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
              onChange={(val: LoadingType) => update({ loading: val })}
              items={loadingOptions}
            />
          </div>
        </div>
      </>
    );
  },
);
