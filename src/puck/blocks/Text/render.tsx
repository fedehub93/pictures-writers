import type { PuckComponent } from "@puckeditor/core";

import type { TextBlockProps } from "./types";
import { TextBlockUi } from "./ui/text";

/**
 * Pure render shared by the editor canvas and the public page.
 *
 * It deliberately imports only the block UI so the public render path never
 * pulls in editor field modules.
 */
export const renderTextBlock: PuckComponent<TextBlockProps> = ({
  text,
  align,
  color,
}) => {
  return <TextBlockUi text={text} align={align} color={color} />;
};
