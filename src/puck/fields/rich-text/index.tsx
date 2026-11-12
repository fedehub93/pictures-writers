import { type RichtextField, RichTextMenu } from "@puckeditor/core";

import { richTextFieldConfig } from "./extensions";
import { ColorPickerPopover } from "./ui/components/color-picker-popover";
import { LinkPickerPopover } from "./ui/components/link-picker-popover";

type RichTextMenuRenderer = NonNullable<RichtextField["renderMenu"]>;
type RichTextMenuProps = Parameters<RichTextMenuRenderer>[0];

/**
 * Default menu for both surfaces: Puck supplies bold, italic and underline as
 * `children`, and the project adds the link and colour controls.
 */
const RichTextMenuWithLinks = ({ editor, children }: RichTextMenuProps) => {
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
};

type RichTextPreset = {
  options?: RichtextField["options"];
  renderMenu?: RichTextMenuRenderer;
  renderInlineMenu?: RichTextMenuRenderer;
};

/**
 * Build a rich text field descriptor for one block.
 *
 * The presets differ in `options` and menus, while the extensions, the link
 * mark and the inline-editing behaviour stay in this module. The public render
 * config keeps reading `richTextFieldConfig` directly, so it resolves values
 * with the same extensions without pulling in the editor menu or the inline
 * editor.
 */
export const createRichTextField = (
  preset: RichTextPreset = {},
): RichtextField => ({
  label: "Text",
  type: "richtext",
  // Puck 0.24 defaults this to true, while the published docs still say
  // false. Pin it explicitly so an upgrade cannot silently stop the canvas
  // from mounting the inline editor.
  contentEditable: true,
  ...richTextFieldConfig,
  options: {
    ...richTextFieldConfig.options,
    ...preset.options,
    // The shared mark is the only link mark: a preset cannot re-enable Puck's
    // built-in one and put two link marks in the same schema.
    link: false,
  },
  renderMenu: preset.renderMenu ?? RichTextMenuWithLinks,
  renderInlineMenu: preset.renderInlineMenu ?? RichTextMenuWithLinks,
});

/** Descriptors the text blocks mount, one per editing surface. */
export const richTextFields = {
  heading: createRichTextField(),
};
