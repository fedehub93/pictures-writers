import type {
  FormDisplayType,
  FormElementsType,
  FormLayoutsType,
} from "./types/core";

import { GridFormLayout } from "./ui/layouts/grid";

import { TextFieldFormElement } from "./ui/fields/text-field";
import { TextareaFieldFormElement } from "./ui/fields/textarea-field";
import { ParagraphFormElement } from "./ui/displays/paragraph";
import { SelectFieldFormElement } from "./ui/fields/select-field";
import { UploadFieldFormElement } from "./ui/fields/upload-field";

export const FormElements: FormElementsType = {
  TextField: TextFieldFormElement,
  TextareaField: TextareaFieldFormElement,
  SelectField: SelectFieldFormElement,
  UploadField: UploadFieldFormElement,
};

export const FormLayouts: FormLayoutsType = {
  Grid: GridFormLayout,
};

export const FormDisplay: FormDisplayType = {
  Paragraph: ParagraphFormElement,
};

export const FormNodes = {
  ...FormElements,
  ...FormLayouts,
  ...FormDisplay,
};
