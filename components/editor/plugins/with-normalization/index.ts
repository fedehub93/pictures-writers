import { CustomEditor } from "../..";
import normalizeLink from "./normalizeLink";
import normalizeEditor from "./normalizeEditor";
import normalizeListItem from "./normalize-list-item";

const withNormalization = (editor: CustomEditor) => {
  const { normalizeNode } = editor;

  editor.normalizeNode = (entry) => {
    let handled = false;

    handled = normalizeEditor(editor, entry);
    if (handled) return;

    handled = normalizeLink(editor, entry);
    if (handled) return;

    handled = normalizeListItem(editor, entry);
    if (handled) return;

    normalizeNode(entry);
  };

  return editor;
};

export default withNormalization;
