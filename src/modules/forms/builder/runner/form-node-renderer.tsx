"use client";

import { FormNodeDynamicInstance } from "../types";
import { FormElements, FormLayouts } from "../registry";

export const FormNodeRenderer = ({
  node,
}: {
  node: FormNodeDynamicInstance;
}) => {
  if (node.isContainer) {
    // Correlated union error
    const LayoutComponent = FormLayouts[node.type]
      .formComponent as React.ComponentType<{
      elementInstance: typeof node;
    }>;

    if (!LayoutComponent) {
      console.warn(`Nessun Layout trovato per il tipo: ${node.type}`);
      return null;
    }

    return <LayoutComponent elementInstance={node} />;
  }

  // Correlated union error
  const ElementComponent = FormElements[node.type]
    .formComponent as React.ComponentType<{
    elementInstance: typeof node;
  }>;

  if (!ElementComponent) {
    console.warn(`Nessun Elemento trovato per il tipo: ${node.type}`);
    return null;
  }

  return <ElementComponent elementInstance={node} />;
};
