import { LucidePuzzle } from "lucide-react";

import { withAccordionField } from "@/puck/utils/with-accordion-field";
import { FormView } from "@/puck/fields/form/view/form-view";

import type { FormRootInstance } from "@/modules/forms/builder/types/core";

export interface FormProps {
  id: string;
}

export interface HydratedFormProps extends FormProps {
  content: FormRootInstance | null;
  gtmEventName: string | null;
}

export const FormField = withAccordionField(
  "Form",
  <LucidePuzzle className="size-4 text-muted-foreground" />,
  ({
    onChange,
    value,
  }: {
    onChange: (value: HydratedFormProps) => void;
    value?: HydratedFormProps;
  }) => {
    const state = value ?? {
      id: "",
      content: null,
      gtmEventName: null,
    };

    const update = (updates: HydratedFormProps) => {
      onChange({
        ...state,
        ...updates,
      });
    };

    return (
      <div className="grid grid-cols-1 gap-y-4 p-1">
        <FormView state={state} onUpdate={update} />
      </div>
    );
  },
);
