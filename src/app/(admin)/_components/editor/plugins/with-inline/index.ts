import { Editor, Element, Path, Transforms } from "slate";
import { CustomEditor } from "../../index";

const withInline = (editor: CustomEditor) => {
  const { isInline, insertBreak, insertSoftBreak } = editor;

  editor.isInline = (element) =>
    element.type === "hyperlink" ? true : isInline(element);

  // Funzione per trovare il primo antenato con un determinato tipo
  // const findAncestor = (
  //   editor: CustomEditor,
  //   path: Path,
  //   type: string
  // ): Path | null => {
  //   let ancestorPath = Path.parent(path);

  //   while (ancestorPath.length > 0) {
  //     const [node] = Editor.node(editor, ancestorPath);
  //     if (Element.isElement(node) && node.type === type) {
  //       return ancestorPath;
  //     }
  //     ancestorPath = Path.parent(ancestorPath);
  //   }

  //   return null; // Nessun antenato trovato
  // };

  // editor.insertBreak = () => {
  //   const { selection } = editor;

  //   if (selection) {
  //     // Trova il nodo corrente e il percorso
  //     const [currentNode, currentPath] = Editor.node(editor, selection);

  //     // Cerca un antenato di tipo info-box
  //     const infoBoxPath = findAncestor(editor, currentPath, "info-box");

  //     if (infoBoxPath) {
  //       // Calcola il percorso successivo all'intero nodo info-box
  //       const nextPath = Path.next(infoBoxPath);

  //       // Inserisce un nuovo nodo paragrafo al livello superiore
  //       Transforms.insertNodes(
  //         editor,
  //         {
  //           type: "paragraph",
  //           children: [{ text: "" }],
  //         },
  //         { at: nextPath } // Specifica la posizione fuori da info-box
  //       );

  //       // Sposta il cursore nel nuovo paragrafo
  //       Transforms.select(editor, nextPath);

  //       return; // Evita il comportamento di default
  //     }
  //   }

  //   // Comportamento di default per altri tipi di nodi
  //   insertBreak();
  // };

  editor.insertSoftBreak = () => {
    Transforms.insertText(editor, "\n");
  };

  return editor;
};

export default withInline;
