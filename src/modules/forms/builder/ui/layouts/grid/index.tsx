"use client";

import { GridIcon } from "lucide-react";

import type { LayoutsType, FormLayout } from "../../../types/core";
import type { GridLayoutProperties } from "../../../types/properties";

import { GridDesignerComponent } from "./designer-component";
import { GridPropertiesComponent } from "./properties-component";
import { GridFormComponent } from "./form-component";

const type: LayoutsType = "Grid";

const properties: GridLayoutProperties = {
  label: "Grid",
};

export const GridFormLayout = {
  isContainer: true,
  type,
  construct: (id: string) => ({
    id,
    isContainer: true,
    type,
    properties,
    children: [],
  }),
  designerBtnElement: {
    icon: GridIcon,
    label: "Grid",
  },
  designerComponent: GridDesignerComponent,
  formComponent: GridFormComponent,
  propertiesComponent: GridPropertiesComponent,
} satisfies FormLayout<"Grid">;
