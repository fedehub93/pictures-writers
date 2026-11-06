import { Field, RichTextMenu } from "@puckeditor/core";

import { richTextFieldConfig } from "./extensions";
import { ColorPickerPopover } from "./ui/components/color-picker-popover";
import { LinkPickerPopover } from "./ui/components/link-picker-popover";

export const RichTextField: Field = {
  label: "Text",
  type: "richtext",
  contentEditable: false,
  ...richTextFieldConfig,
  renderMenu: ({ editor, children }) => {
    if (!editor) return null;

    return (
      <RichTextMenu>
        {children}
        <RichTextMenu.Group>
          <LinkPickerPopover editor={editor} />
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
          <LinkPickerPopover editor={editor} />
          <ColorPickerPopover editor={editor} />
        </RichTextMenu.Group>
      </RichTextMenu>
    );
  },
};
