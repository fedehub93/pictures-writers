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
 * Default menu for both surfaces: Puck supplies bold, italic and underline as
 * `children`, and the project adds the link and colour controls.
 */
const RichTextMenuWithLinks = ({ editor, children }: RichTextMenuProps) => {
  if (!editor) return null;

  const container = getRichTextMenuPortalContainer(editor);

  return (
    <RichTextMenu>
      {children}
      <RichTextMenu.Group>
        <LinkPickerPopover editor={editor} container={container} />
        <ColorPickerPopover editor={editor} container={container} />
      </RichTextMenu.Group>
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
};
