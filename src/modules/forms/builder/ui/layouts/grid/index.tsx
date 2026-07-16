"use client";

import { GridIcon } from "lucide-react";

import type {
  GridLayoutProperties,
  LayoutsType,
  FormLayout,
} from "../../../types";

import { DesignerComponent } from "./designer-component";

const type: LayoutsType = "Grid";

const properties: GridLayoutProperties = {
  label: "Grid",
  column: 2,
  gap: "2px",
};

export const GridFormLayout: FormLayout = {
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
  designerComponent: DesignerComponent,
  formComponent: () => <div>Form Component</div>,
  propertiesComponent: () => <div>Properties Component</div>,
};
