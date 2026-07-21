import { ImageIcon } from "lucide-react";

import { IconName } from "@/shared/ui/icon-picker";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { IconView } from "./view/icon-view";

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

    return (
      <div className="grid grid-cols-1 gap-y-4 p-1">
        <IconView state={state} onUpdate={update} />
      </div>
    );
  },
  true,
);
