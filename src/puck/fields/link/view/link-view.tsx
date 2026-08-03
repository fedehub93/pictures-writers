import { InputTextField } from "@/puck/components/text-field";

import type { LinkProps } from "../index";

interface LinkViewProps {
  state: LinkProps;
  onUpdate: (values: LinkProps) => void;
  resetProp: (key: keyof LinkProps) => void;
}

export const LinkView = ({ state, onUpdate, resetProp }: LinkViewProps) => {
  return (
    <div className="grid grid-cols-1 gap-y-4 p-1">
      <InputTextField
        key="label"
        label="Label"
        name="label"
        type="text"
        placeholder="Torna alla Home"
        currentValues={state}
        renderValues={state}
        update={onUpdate}
        resetProp={resetProp}
      />
      <InputTextField
        key="href"
        label="Href"
        name="href"
        type="text"
        placeholder="/about"
        currentValues={state}
        renderValues={state}
        update={onUpdate}
        resetProp={resetProp}
      />
    </div>
  );
};
