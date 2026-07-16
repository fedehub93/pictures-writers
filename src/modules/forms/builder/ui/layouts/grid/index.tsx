"use client";

import { GridIcon } from "lucide-react";

import type {
  GridLayoutProperties,
  LayoutsType,
  FormLayout,
} from "../../../types";

import { GridDesignerComponent } from "./designer-component";
import { GridPropertiesComponent } from "./properties-component";

const type: LayoutsType = "Grid";

const properties: GridLayoutProperties = {
  label: "Grid",
  column: 2,
  gap: "2px",
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
  formComponent: () => <div>Form Component</div>,
  propertiesComponent: GridPropertiesComponent,
} satisfies FormLayout<"Grid">;
