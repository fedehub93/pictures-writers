import type { PuckComponent } from "@puckeditor/core";

import type { LinkListBlockProps } from "./types";
import { LinkListBlockUi } from "./ui/link-list";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * It deliberately imports only the block UI so the public render path never
 * pulls in editor field modules.
 */
export const renderLinkListBlock: PuckComponent<LinkListBlockProps> = ({
  title,
  links,
}) => <LinkListBlockUi title={title} links={links} />;
