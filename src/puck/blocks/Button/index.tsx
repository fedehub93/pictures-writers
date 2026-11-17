import { type ComponentConfig } from "@puckeditor/core";

import { createSizeField } from "@/puck/fields/size";
import { SpacingField } from "@/puck/fields/spacing";
import { DecorationField } from "@/puck/fields/decoration";
import { TypographyField } from "@/puck/fields/typography";
import { DisplayOnlyLayoutField } from "@/puck/fields/layout";

import { BUTTON_DEFAULT_PROPS } from "../defaults";
import { ButtonContentField } from "./field";

import type { ButtonProps } from "./types";
import { renderButtonBlock } from "./render";
import { BUTTON_BASE_WIDTH } from "./constants";

export type { ButtonProps };

export const ButtonBlock: ComponentConfig<ButtonProps> = {
  // The rendered anchor is the block root; the render hands `puck.dragRef` to
  // it and `inline` is Puck's only supported way to skip its wrapper `div`.
  inline: true,
  fields: {
    button: ButtonContentField,
    layout: DisplayOnlyLayoutField,
    size: createSizeField({ baseWidth: BUTTON_BASE_WIDTH }),
    spacing: SpacingField,
    typography: TypographyField,
    decoration: DecorationField,
  },
  defaultProps: BUTTON_DEFAULT_PROPS,
  render: renderButtonBlock,
};
