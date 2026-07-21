import { MousePointerClickIcon } from "lucide-react";

import type { DisplayType, FormDisplay } from "../../../types/core";

import { ButtonDesignerComponent } from "./designer-component";
import { ButtonPropertiesComponent } from "./properties-component";
import { ButtonFormComponent } from "./form-component";

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
