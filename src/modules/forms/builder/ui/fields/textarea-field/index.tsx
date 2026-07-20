import { MessageSquareTextIcon } from "lucide-react";

import type { ElementsType, FormElement } from "../../../types/core";
import type { TextareaFieldProperties } from "../../../types/properties";

import { TextareaFieldDesignerComponent } from "./designer-component";
import { TextareaFieldPropertiesComponent } from "./properties-component";
import { buildSchema } from "./schemas";
import { TextareaFieldFormComponent } from "./form-component";

const type: ElementsType = "TextareaField";

const properties: TextareaFieldProperties = {
  name: "textarea-field",
  label: "Textarea field",
  helperText: "",
  placeholder: "Inserisci qui il tuo testo...",
  validation: {
    required: false,
  },
};

export const TextareaFieldFormElement = {
  isContainer: false,
  type,
  construct: (id: string) => ({
    id,
    isContainer: false,
    type,
    properties,
  }),
  designerBtnElement: {
    label: "Textarea",
    icon: MessageSquareTextIcon,
  },
  designerComponent: TextareaFieldDesignerComponent,
  formComponent: TextareaFieldFormComponent,
  propertiesComponent: TextareaFieldPropertiesComponent,
  buildSchema: (properties) => buildSchema(properties),
  getInitialValue: () => "",
} satisfies FormElement<"TextareaField">;
