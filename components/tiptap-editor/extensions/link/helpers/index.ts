import type { Editor } from "@tiptap/react";

export const setLinkMark = (
  editor: Editor,
  options: { href: string; follow?: boolean }
) => {
  const { href, follow } = options;
  console.log(follow);
  return editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href, rel: follow ? "" : "nofollow" })
    .run();
};

export const removeLinkMark = (editor: Editor) => {
  editor.chain().focus().extendMarkRange("link").unsetLink().run();
};
