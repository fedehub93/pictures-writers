import type { Editor } from "@tiptap/react";

export const insertProduct = (editor: Editor, data: { rootId: string }) => {
  console.log(data)
  editor.chain().focus().insertProduct({
    productRootId: data.rootId,
  });
};
