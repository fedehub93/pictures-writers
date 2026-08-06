import { PropHeader } from "@/puck/components/prop-header";
import { TextInput } from "@/puck/components/text-input";

import type { LinkProps } from "../../index";

interface LinkViewProps {
  state: LinkProps;
  onUpdate: (values: LinkProps) => void;
  resetProp: (key: keyof LinkProps) => void;
}

export const LinkView = ({ state, onUpdate, resetProp }: LinkViewProps) => {
  return (
    <div className="grid grid-cols-1 gap-y-4 p-1">
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="label"
          label="Alt Text"
          isModified={state.label !== undefined}
          onReset={() => resetProp("label")}
        />
        <TextInput
          name="label"
          value={state.label}
          onChange={(newVal) => onUpdate({ label: newVal || undefined })}
          placeholder="Google"
        />
      </div>
      <div className="flex flex-col gap-y-1">
        <PropHeader
          name="href"
          label="Link"
          isModified={state.href !== undefined}
          onReset={() => resetProp("href")}
        />
        <TextInput
          name="href"
          value={state.href}
          onChange={(newVal) => onUpdate({ href: newVal || undefined })}
          placeholder="https://google.com/"
        />
      </div>
    </div>
  );
};
