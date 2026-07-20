"use client";

import { UploadIcon } from "lucide-react";

import type { ElementsType, FormElement } from "../../../types/core";

import type { UploadFieldProperties } from "../../../types/properties";

import { UploadFieldDesignerComponent } from "./designer-component";
import { UploadFieldFormComponent } from "./form-component";
import { UploadFieldPropertiesComponent } from "./properties-component";

import { buildSchema } from "./schemas";

const type: ElementsType = "UploadField";

const properties: UploadFieldProperties = {
  name: "upload-field",
  label: "Upload field",
  helperText: "",
  files: [],
  validation: {
    required: false,
  },
};

export const UploadFieldFormElement = {
  isContainer: false,
  type,
  construct: (id: string) => ({
    id,
    isContainer: false,
    type,
    properties,
  }),
  designerBtnElement: {
    icon: UploadIcon,
    label: "Upload field",
  },
  designerComponent: UploadFieldDesignerComponent,
  formComponent: UploadFieldFormComponent,
  propertiesComponent: UploadFieldPropertiesComponent,
  buildSchema,
  getInitialValue: () => [],
} satisfies FormElement<"UploadField">;
