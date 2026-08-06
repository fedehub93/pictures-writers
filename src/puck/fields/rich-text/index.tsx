import { Field, RichTextMenu } from "@puckeditor/core";
import { Color, TextStyle } from "@tiptap/extension-text-style";

import { ColorPickerPopover } from "./ui/components/color-picker-popover";

export const RichTextField: Field = {
  label: "Text",
  type: "richtext",
  contentEditable: false,
  renderMenu: ({ editor, children }) => {
    if (!editor) return null;

    return (
      <RichTextMenu>
        {children}
        <RichTextMenu.Group>
          <ColorPickerPopover editor={editor} />
        </RichTextMenu.Group>
      </RichTextMenu>
    );
  },
  renderInlineMenu: ({ editor, children }) => {
    if (!editor) return null;

    return (
      <RichTextMenu>
        {children}
        <RichTextMenu.Group>
          <ColorPickerPopover editor={editor} />
        </RichTextMenu.Group>
      </RichTextMenu>
    );
  },
  tiptap: {
    extensions: [TextStyle, Color],
  },
};
