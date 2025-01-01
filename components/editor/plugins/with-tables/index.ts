import { Editor } from 'slate';

export const withTables = (editor: Editor) => {
  const { isVoid } = editor;

  editor.isVoid = element => (element.type === 'table' ? true : isVoid(element));

  return editor;
};
