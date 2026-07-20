"use client";

import type {
  ElementsType,
  DisplayType,
  FormNodeDynamicInstance,
} from "../types/core";
import { FormElements, FormLayouts, FormDisplay } from "../registry";

export const FormNodeRenderer = ({
  node,
}: {
  node: FormNodeDynamicInstance;
}) => {
  if (node.isContainer) {
    const LayoutComponent = FormLayouts[node.type]?.formComponent as
      | React.ComponentType<{
          elementInstance: typeof node;
        }>
      | undefined;

    if (!LayoutComponent) return null;
    return <LayoutComponent elementInstance={node} />;
  }

  // 1. Gestione degli Input
  if (node.type in FormElements) {
    // IL TRUCCO È QUI: Diciamo a TS che questa stringa è sicuramente un ElementsType
    const type = node.type as ElementsType;

    const ElementComponent = FormElements[type]
      .formComponent as React.ComponentType<{
      elementInstance: typeof node;
    }>;

    return <ElementComponent elementInstance={node} />;
  }

  // 2. Gestione dei Display
  if (node.type in FormDisplay) {
    const type = node.type as DisplayType;

    const DisplayComponent = FormDisplay[type]
      .formComponent as React.ComponentType<{
      elementInstance: typeof node;
    }>;

    return <DisplayComponent elementInstance={node} />;
  }

  return null;
};
