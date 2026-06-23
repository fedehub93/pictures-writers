import { TextFieldFormElement } from "./text-field";

export type ElementsType = "TextField";

export type FormElement = {
  type: ElementsType;

  designerBtnElement: {
    icon: React.ReactElement;
    label: string;
  };

  designerComponent: React.FC;
  formComponent: React.FC;
  propertiesComponent: React.FC;
};

type FormElementsType = {
  [key in ElementsType]: FormElement;
};

export const FormElements: FormElementsType = {
  TextField: TextFieldFormElement,
};
