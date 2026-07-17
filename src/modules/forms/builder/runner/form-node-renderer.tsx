"use client";

import { FormNodeDynamicInstance } from "../types";
import { FormElements, FormLayouts } from "../registry";

export const FormNodeRenderer = ({
  node,
}: {
  node: FormNodeDynamicInstance;
}) => {
  if (node.isContainer) {
    const LayoutComponent = FormLayouts[node.type].formComponent;

    if (!LayoutComponent) {
      console.warn(`Nessun Layout trovato per il tipo: ${node.type}`);
      return null;
    }

    return <LayoutComponent elementInstance={node} />;
  }

  const ElementComponent = FormElements[node.type].formComponent;

  if (!ElementComponent) {
    console.warn(`Nessun Elemento trovato per il tipo: ${node.type}`);
    return null;
  }

  return <ElementComponent elementInstance={node} />;
};
