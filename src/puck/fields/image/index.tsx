import { ImageIcon } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { ImageView } from "./ui/view/image-view";
import type { LoadingType, ObjectFitType } from "./types";

export interface ImageProps {
  src?: string;
  alt?: string;
  href?: string;
  objectFit?: ObjectFitType;
  loading?: LoadingType;
}

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

      onChange(newState);
    };

    return (
      <ImageView
        currentValues={state}
        renderValues={state}
        resetProp={resetProp}
        onUpdate={update}
      />
    );
  },
);
