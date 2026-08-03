import { LinkIcon } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";

import { LinkView } from "./view/link-view";

export interface LinkProps {
  label?: string;
  href?: string;
}

export const LinkField = withAccordionField(
  "Link",
  <LinkIcon className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: LinkProps) => void;
    value: LinkProps;
  }) => {
    const state = value ?? {};

    const update = (updates: LinkProps) => {
      onChange({
        ...state,
        ...updates,
      });
    };

    const resetProp = (key: keyof LinkProps) => {
      const newState = { ...state };
      delete newState[key];

      // Salviamo il nuovo stato da cui abbiamo rimosso la chiave
      onChange(newState);
    };

    return <LinkView state={state} onUpdate={update} resetProp={resetProp} />;
  },
  true,
);
