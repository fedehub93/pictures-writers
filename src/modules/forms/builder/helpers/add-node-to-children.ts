import type {
  FormNodeDynamicInstance,
  FormElementInstanceUnion,
} from "../types";

/**
 * Cerca un nodo Layout tra i figli del Root e aggiunge un Element.
 * L'array viene mutato in-place.
 */
export function addNodeToChildren(
  children: FormNodeDynamicInstance[], // Questi sono i figli diretti del Root
  parentId: string,
  nodeToAdd: FormNodeDynamicInstance,
  index?: number,
): boolean {
  for (const node of children) {
    // Troviamo il Layout di destinazione
    if (node.id === parentId && node.isContainer) {
      // Controllo di dominio: impedisce l'inserimento di Layout dentro Layout
      if (nodeToAdd.isContainer) {
        console.error(
          "Errore di dominio: Un Layout può contenere esclusivamente Elementi.",
        );
        return false;
      }

      // Type Narrowing: a questo punto siamo certi che nodeToAdd è un Elemento.
      // Eseguiamo il cast per assecondare la firma node.children (FormElementInstance[])
      const elementToAdd = nodeToAdd as FormElementInstanceUnion;

      if (index !== undefined) {
        node.children.splice(index, 0, elementToAdd);
      } else {
        node.children.push(elementToAdd);
      }
      return true; // Nodo aggiunto con successo
    }
  }

  // Nessuna ricorsione necessaria. L'albero non ha ulteriori livelli
  // in cui un layout potrebbe annidarsi.
  return false;
}
