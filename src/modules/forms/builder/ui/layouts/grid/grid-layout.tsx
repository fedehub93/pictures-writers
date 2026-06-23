"use client";

import { GridIcon } from "lucide-react";

import {
  type GridLayoutProperties,
  type LayoutsType,
  type FormLayout,
} from "../../../types";

import { DesignerComponent } from "./designer-component";

const type: LayoutsType = "Grid";

const properties: GridLayoutProperties = {
  label: "Grid",
  column: 2,
  gap: "2px",
};

export const GridFormLayout: FormLayout = {
  type,
  construct: (id: string) => ({
    id,
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
