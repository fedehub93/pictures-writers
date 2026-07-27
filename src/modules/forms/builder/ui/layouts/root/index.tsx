"use client";

import { GridIcon } from "lucide-react";

import type { RootType, FormRoot } from "../../../types/core";
import type { RootProperties } from "../../../types/properties";
import { RootDesignerComponent } from "./designer-component";
import { RootPropertiesComponent } from "./properties-component";

const type: RootType = "Root";

const properties: RootProperties = {
  submission: {
    onSuccess: {
      type: "toast",
      successMessage: "Il form è stato inviato correttamente!",
    },
  },
};

export const RootFormLayout = {
  isContainer: true,
  type,
  construct: () => ({
    id: "root",
    isContainer: true,
    type,
    properties,
    children: [],
  }),
  designerBtnElement: {
    icon: GridIcon,
    label: "Grid",
  },
  designerComponent: RootDesignerComponent,
  formComponent: () => <>Form component</>,
  propertiesComponent: RootPropertiesComponent,
} satisfies FormRoot<"Root">;
