import { CustomEditor } from "../../index";
import { CustomEditorHelper } from "../../utils/custom-editor";

const withEmbeds = (editor: CustomEditor) => {
  const { isVoid, insertData } = editor;

  editor.isVoid = (element) => {
    return ["image", "video"].includes(element.type) ? true : isVoid(element);
  };

  editor.insertData = (data) => {
    const text = data.getData("text/plain");
    const { files } = data;

    if (files && files.length > 0) {
      for (const file of files) {
        const reader = new FileReader();
        const [mime] = file.type.split("/");

        if (mime === "image") {
          reader.addEventListener("load", () => {
            const url = reader.result as string;
            CustomEditorHelper.insertImage(editor, url, "");
          });

          reader.readAsDataURL(file);
        }
      }
    } else if (CustomEditorHelper.isImageUrl(text)) {
      CustomEditorHelper.insertImage(editor, text, "");
    } else {
      insertData(data);
    }
  };

  return editor;
};

export default withEmbeds;
