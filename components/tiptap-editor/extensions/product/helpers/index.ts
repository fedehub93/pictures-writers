import type { Editor } from "@tiptap/react";

export const insertProduct = (editor: Editor, data: { rootId: string }) => {
  editor.chain().focus().insertProduct({
    productRootId: data.rootId,
  });
};
