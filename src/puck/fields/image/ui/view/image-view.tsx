import { RabbitIcon, SnailIcon } from "lucide-react";

import { PropHeader } from "@/puck/components/prop-header";
import { SelectField } from "@/puck/components/select-input";
import { TextInput } from "@/puck/components/text-input";
import { SegmentedControl } from "@/puck/components/segmented-control";

import type { ImageProps } from "../../index";
import type { FitOptionsType, LoadingOptionsType } from "../../types";

const objectFitOptions = [
  { label: "Cover", value: "cover" },
  { label: "Contain", value: "contain" },
  { label: "Fill ", value: "fill" },
  { label: "None", value: "none" },
] satisfies FitOptionsType[];

const loadingOptions = [
  { title: "Lazy", value: "lazy", icon: SnailIcon },
  { title: "Eager", value: "eager", icon: RabbitIcon },
] satisfies LoadingOptionsType[];

interface ImageViewProps {
  currentValues: Partial<ImageProps>;
  renderValues: ImageProps;
  resetProp: (key: keyof ImageProps) => void;
  onUpdate: (values: Partial<ImageProps>) => void;
}

export const ImageView = ({
  currentValues,
  renderValues,
  resetProp,
  onUpdate,
}: ImageViewProps) => {
  return (
    <div className="flex flex-col gap-y-2 p-1">
      <div className="flex flex-col gap-y-4 p-1">
        <div className="flex flex-col gap-y-1">
          <PropHeader
            name="src"
            label="Image URL"
            isModified={currentValues.src !== undefined}
            onReset={() => resetProp("src")}
          />
          <TextInput
            name="src"
            value={renderValues.src}
            onChange={(newVal) => onUpdate({ src: newVal || undefined })}
            placeholder="https://example.com/image.jpg"
          />
        </div>

        <div className="grid grid-cols-2 gap-x-4">
          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="alt"
              label="Alt Text"
              isModified={currentValues.alt !== undefined}
              onReset={() => resetProp("alt")}
            />
            <TextInput
              name="alt"
              value={renderValues.alt}
              onChange={(newVal) => onUpdate({ alt: newVal || undefined })}
              placeholder="Enter alt text"
            />
          </div>

          <div className="flex flex-col gap-y-1">
            <PropHeader
              name="href"
              label="Link (Opzionale)"
              isModified={currentValues.href !== undefined}
              onReset={() => resetProp("href")}
            />
            <TextInput
              name="href"
              value={renderValues.href ?? ""}
              onChange={(newVal) => onUpdate({ href: newVal || undefined })}
              placeholder="https://pictureswriters.com/about/"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 p-1 flex flex-col gap-y-4">
        <SelectField
          key="objectFit"
          name="objectFit"
          label="Object Fit"
          placeholder="fill"
          options={objectFitOptions.map((o) => o.value)}
          currentValues={currentValues}
          renderValues={renderValues}
          resetProp={resetProp}
          update={onUpdate}
        />

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
            onChange={(val) => onUpdate({ loading: val })}
            items={loadingOptions}
          />
        </div>
      </div>
    </div>
  );
};
