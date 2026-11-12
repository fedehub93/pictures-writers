import { type RichtextField, RichTextMenu } from "@puckeditor/core";
import type { Editor } from "@tiptap/core";

import { ColorPickerPopover } from "./ui/components/color-picker-popover";
import { LinkPickerPopover } from "./ui/components/link-picker-popover";
import {
  type RichTextFieldDescriptor,
  richTextDescriptors,
} from "./presets";

type RichTextMenuRenderer = NonNullable<RichtextField["renderMenu"]>;
type RichTextMenuProps = Parameters<RichTextMenuRenderer>[0];

/**
 * The body of the document the editor is rendered in.
 *
 * Puck portals the inline toolbar and editor into the canvas iframe, so the
 * link and colour panels have to portal into that same body. In the sidebar
 * the editor lives in the editor window and the panel lands in its body, which
 * is Radix's default anyway.
 */
export const getRichTextMenuPortalContainer = (
  editor: Editor | null,
): HTMLElement | null => editor?.view.dom.ownerDocument.body ?? null;

/**
 * Link and colour controls, the project's additions to Puck's default menu.
 *
 * They live in a group of their own so a preset can place them after whatever
 * else it adds. The panel container is the editor's document, which is the
 * canvas iframe while editing there and the editor window in the sidebar.
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
 * Default menu for both surfaces: Puck supplies bold, italic and underline as
 * `children`, and the project adds the link and colour controls.
 */
const RichTextMenuWithLinks = ({ editor, children }: RichTextMenuProps) => {
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
 * Puck's inline `children` only carry bold, italic and underline; the heading
 * and list selects exist in the sidebar menu only. A Text block authors whole
 * passages on the canvas, so its toolbar offers those two controls explicitly:
 * the selected paragraph becomes a heading or a list, and the selects turn it
 * back into a paragraph.
 */
const TextRichTextInlineMenu = ({ editor, children }: RichTextMenuProps) => {
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

type RichTextMenus = {
  renderMenu?: RichTextMenuRenderer;
  renderInlineMenu?: RichTextMenuRenderer;
};

/**
 * Build the editor field for one block from its shared descriptor.
 *
 * `options` and `tiptap` come from `presets.ts`, the module the public render
 * config also imports, so the canvas and the page cannot resolve the same
 * stored HTML with different schemas. Only the editor-only members are added
 * here: the inline-editing flag and the two menus.
 */
export const createRichTextField = (
  descriptor: RichTextFieldDescriptor,
  menus: RichTextMenus = {},
): RichtextField => ({
  label: "Text",
  // Puck 0.24 defaults this to true, while the published docs still say
  // false. Pin it explicitly so an upgrade cannot silently stop the canvas
  // from mounting the inline editor.
  contentEditable: true,
  ...descriptor,
  renderMenu: menus.renderMenu ?? RichTextMenuWithLinks,
  renderInlineMenu: menus.renderInlineMenu ?? RichTextMenuWithLinks,
});

/** Descriptors the text blocks mount, one per editing surface. */
export const richTextFields = {
  heading: createRichTextField(richTextDescriptors.heading),
  text: createRichTextField(richTextDescriptors.text, {
    renderInlineMenu: TextRichTextInlineMenu,
  }),
};
