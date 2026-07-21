import type {
  FormDisplayType,
  FormElementsType,
  FormLayoutsType,
} from "./types/core";

import { GridFormLayout } from "./ui/layouts/grid";

import { TextFieldFormElement } from "./ui/fields/text-field";
import { TextareaFieldFormElement } from "./ui/fields/textarea-field";
import { SelectFieldFormElement } from "./ui/fields/select-field";
import { CheckboxFieldFormElement } from "./ui/fields/checkbox-field";
import { UploadFieldFormElement } from "./ui/fields/upload-field";

import { ParagraphFormElement } from "./ui/displays/paragraph";
import { ButtonFormElement } from "./ui/displays/button";

import { RootFormLayout } from "./ui/layouts/root";

export const FormRoot = {
  Root: RootFormLayout,
};

export const FormElements: FormElementsType = {
  TextField: TextFieldFormElement,
  TextareaField: TextareaFieldFormElement,
  SelectField: SelectFieldFormElement,
  CheckboxField: CheckboxFieldFormElement,
  UploadField: UploadFieldFormElement,
};

export const FormLayouts: FormLayoutsType = {
  Grid: GridFormLayout,
};

export const FormDisplay: FormDisplayType = {
  Paragraph: ParagraphFormElement,
  Button: ButtonFormElement,
};

export const FormNodes = {
  ...FormRoot,
  ...FormElements,
  ...FormLayouts,
  ...FormDisplay,
};
