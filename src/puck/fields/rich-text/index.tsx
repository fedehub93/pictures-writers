import "client-only";

import { type RichtextField, RichTextMenu } from "@puckeditor/core";
import type { Editor } from "@tiptap/core";

import { ColorPickerPopover } from "./ui/components/color-picker-popover";
import { LinkPickerPopover } from "./ui/components/link-picker-popover";
import {
  type RichTextFieldDescriptor,
  richTextDescriptors,
} from "./presets";

type RichTextMenuRenderer = NonNullable<RichtextField["renderInlineMenu"]>;
type RichTextMenuProps = Parameters<RichTextMenuRenderer>[0];

/**
 * The body of the document the editor is rendered in.
 *
 * Puck portals the inline toolbar and editor into the canvas iframe, so the
 * link and colour panels have to portal into that same body.
 */
export const getRichTextMenuPortalContainer = (
  editor: Editor | null,
): HTMLElement | null => editor?.view.dom.ownerDocument.body ?? null;

/**
 * Link and colour controls, the project's additions to Puck's default menu.
 *
 * They live in a group of their own so a preset can place them after whatever
 * else it adds. The panel container is the editor's document, which is the
 * canvas iframe.
 */
const LinkAndColorControls = ({ editor }: { editor: Editor }) => {
  const container = getRichTextMenuPortalContainer(editor);

  return (
    <RichTextMenu.Group>
      <LinkPickerPopover editor={editor} container={container} />
      <ColorPickerPopover editor={editor} container={container} />
    </RichTextMenu.Group>
  );
};

/**
 * Default inline menu for both blocks: Puck supplies bold, italic and
 * underline as `children`, and the project adds the link and colour controls.
 */
const InlineMenuWithLinks = ({ editor, children }: RichTextMenuProps) => {
  if (!editor) return null;

  return (
    <RichTextMenu>
      {children}
      <LinkAndColorControls editor={editor} />
    </RichTextMenu>
  );
};

/**
 * Inline menu for the Text block.
 *
 * Puck's inline `children` only carry bold, italic and underline, not the
 * heading or list selects. A Text block authors whole passages on the canvas,
 * so its toolbar offers those two controls explicitly: the selected paragraph
 * becomes a heading or a list, and the selects turn it back into a paragraph.
 */
const TextInlineMenu = ({ editor, children }: RichTextMenuProps) => {
  if (!editor) return null;

  return (
    <RichTextMenu>
      <RichTextMenu.Group>
        <RichTextMenu.HeadingSelect />
        <RichTextMenu.ListSelect />
      </RichTextMenu.Group>
      {children}
      <LinkAndColorControls editor={editor} />
    </RichTextMenu>
  );
};

/**
 * Build the editor field for one block from its shared descriptor.
 *
 * `options` and `tiptap` come from `presets.ts`, the module the public render
 * config also imports, so the canvas and the page cannot resolve the same
 * stored HTML with different schemas. Only the editor-only members are added
 * here: the inline-editing flag, the sidebar visibility flag and the inline
 * menu.
 */
export const createRichTextField = (
  descriptor: RichTextFieldDescriptor,
  renderInlineMenu: RichTextMenuRenderer = InlineMenuWithLinks,
): RichtextField => ({
  label: "Text",
  ...descriptor,
  // Puck 0.24 defaults this to true, while the published docs still say
  // false. Pin it explicitly, after the descriptor, so an upgrade or a wider
  // descriptor type cannot silently stop the canvas from mounting the editor.
  contentEditable: true,
  // The text is authored and formatted on the canvas only. `visible` is
  // honoured when Puck draws the sidebar; the canvas transform reads the raw
  // descriptor, so the field stays editable on the block.
  visible: false,
  renderInlineMenu,
});

/** Fields the text blocks mount, with the editor-only behaviour each needs. */
export const richTextFields = {
  heading: createRichTextField(richTextDescriptors.heading),
  text: createRichTextField(richTextDescriptors.text, TextInlineMenu),
};
