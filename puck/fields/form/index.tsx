import { useCallback } from "react";
import { LucidePuzzle } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { FormView } from "./view/form-view";

export interface FormProps {
  id: string;
  name: string;
  fields: string;
  submitLabel: string | null;
  gtmEventName: string | null;
}

export const FormField = withAccordionField(
  "Form",
  <LucidePuzzle className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: FormProps) => void;
    value?: FormProps;
  }) => {
    const state = value ?? {
      id: "",
      name: "",
      fields: "",
      submitLabel: "",
      gtmEventName: "",
    };

    const update = useCallback(
      (updates: FormProps) => {
        onChange({
          ...state,
          ...updates,
        });
      },
      [onChange, state],
    );

    return (
      <div className="grid grid-cols-1 gap-y-4 p-1">
        <FormView state={state} onUpdate={update} />
      </div>
    );
  },
);
