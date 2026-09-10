import type { Editor } from "@tiptap/react";

export const setLinkMark = (
  editor: Editor,
  options: { href: string; nofollow?: boolean }
) => {
  const { href, nofollow } = options;

  return editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href })
    .updateAttributes("link", { nofollow: nofollow ?? true })
    .run();
};

export const updateLinkMark = (
  editor: Editor,
  options: { href: string; nofollow?: boolean }
) => {
  const { href, nofollow } = options;

  return editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .updateAttributes("link", { href, nofollow })
    .run();
};

export const removeLinkMark = (editor: Editor) => {
  editor.chain().focus().extendMarkRange("link").unsetLink().run();
};
