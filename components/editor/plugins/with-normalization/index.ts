import { CustomEditor } from "../..";
import normalizeLink from "./normalize-link";
import normalizeEditor from "./normalize-editor";
import normalizeListItem from "./normalize-list-item";
import normalizeList from "./normalize-list";

const withNormalization = (editor: CustomEditor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    let handled = false;

    handled = normalizeEditor(editor, entry);
    if (handled) return;

    handled = normalizeLink(editor, entry);
    if (handled) return;

    handled = normalizeList(editor, entry);
    if (handled) return;

    handled = normalizeListItem(editor, entry);
    if (handled) return;

    normalizeNode(entry);
  };

  return editor;
};

export default withNormalization;
