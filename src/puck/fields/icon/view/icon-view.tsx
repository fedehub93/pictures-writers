"use client";

import { IconProps } from "@/puck/fields/icon";
import { IconPicker } from "@/components/ui/icon-picker";

interface IconViewProps {
  state?: IconProps;
  onUpdate: (values: IconProps) => void;
}

export const IconView = ({ state, onUpdate }: IconViewProps) => {
  return (
    <div>
      <IconPicker
        value={state?.name}
        onValueChange={(val) => onUpdate({ name: val })}
      />
    </div>
  );
};
