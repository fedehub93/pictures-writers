import type {
  FormNodeDynamicInstance,
  FormElementInstanceUnion,
} from "../types/core";

import { FormElements } from "../registry"; // Importiamo il registry degli input

export function getFlatFields(
  nodes: FormNodeDynamicInstance[],
): FormElementInstanceUnion[] {
  return nodes.flatMap((node): FormElementInstanceUnion[] => {
    // 1. Se è un contenitore (es. Grid), navighiamo al suo interno.
    // Usiamo la ricorsione chiamando di nuovo getFlatFields sui children.
    // In questo modo filtriamo automaticamente i display anche se annidati.
    if (node.isContainer) {
      if (node.children.length > 0) {
        return getFlatFields(node.children);
      }
      return [];
    }

    // 2. È una "foglia" (isContainer: false).
    // Dobbiamo distinguere tra FormElement (input) e FormDisplay (testo/ui).
    // Usiamo l'operatore 'in' sul nostro registry per capire se è un input valido.
    if (node.type in FormElements) {
      return [node as FormElementInstanceUnion];
    }

    // 3. Se è un FormDisplay o qualsiasi altro nodo non registrato negli elementi,
    // restituiamo un array vuoto. flatMap lo eliminerà silenziosamente dal risultato finale.
    return [];
  });
}
