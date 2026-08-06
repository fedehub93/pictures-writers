import { ImageIcon } from "lucide-react";

import { IconName } from "@/shared/ui/icon-picker";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { IconView } from "./ui/view/icon-view";

export interface IconProps {
  name?: IconName;
}

export const IconField = withAccordionField(
  "Icon",
  <ImageIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: IconProps) => void;
    value: IconProps;
  }) => {
    const state = value ?? {};

    const update = (updates: IconProps) => {
      onChange({
        ...state,
        ...updates,
      });
    };

    return <IconView state={state} onUpdate={update} />;
  },
  true,
);
