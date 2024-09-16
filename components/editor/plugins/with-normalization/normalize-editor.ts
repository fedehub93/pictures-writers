import { NodeEntry, Transforms } from "slate";
import { CustomEditor } from "../..";

const normalizeEditor = (editor: CustomEditor, entry: NodeEntry) => {
  const [node, path] = entry;

  // Se siamo alla radice e non ci sono nodi figli
  if (path.length === 0 && editor.children.length === 0) {
    // Inserisce un nodo di default (es: un paragrafo vuoto)
    const defaultNode = {
      type: "paragraph",
      children: [{ text: "" }],
    };

    // Aggiunge il nodo di default
    Transforms.insertNodes(editor, defaultNode, { at: [0] });
    return true; // Evita di chiamare la normale pipeline di normalizzazione
  }
  return false;
};

export default normalizeEditor;
