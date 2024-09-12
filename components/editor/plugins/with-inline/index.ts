import { CustomEditor } from "../../index";

const withInline = (editor: CustomEditor) => {
  const { isInline } = editor;

  editor.isInline = (element) =>
    element.type === "hyperlink" ? true : isInline(element);

  return editor;
};

export default withInline;
