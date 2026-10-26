"use client";

import "client-only";
import { lazy } from "react";
import { MousePointerClickIcon } from "lucide-react";

import type { DisplayType, FormDisplay } from "../../../types/core";

import { ButtonDesignerComponent } from "./designer-component";
import { ButtonFormComponent } from "./form-component";

const ButtonPropertiesComponent = lazy(() =>
  import("./properties-component").then((module) => ({
    default: module.ButtonPropertiesComponent,
  })),
);

const type: DisplayType = "Button";

export const ButtonFormElement = {
  isContainer: false,
  type,
  construct: (id: string) => ({
    id,
    isContainer: false,
    type,
    properties: {
      label: "Button",
    },
  }),
  designerBtnElement: {
    icon: MousePointerClickIcon,
    label: "Button",
  },
  designerComponent: ButtonDesignerComponent,
  formComponent: ButtonFormComponent,
  propertiesComponent: ButtonPropertiesComponent,
} satisfies FormDisplay<"Button">;
