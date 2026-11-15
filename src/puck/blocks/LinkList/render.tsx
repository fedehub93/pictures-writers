import {
  getSizeVars,
  getSpacingVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import type { LinkListBlockRenderProps } from "./types";
import { LinkListBlockUi } from "./ui/link-list";

/**
 * Pure render shared by the editor canvas and the public Site region.
 *
 * It deliberately imports only the block UI and the shared style-variable
 * utilities so the public render path never pulls in editor field modules.
 *
 * `editing` is passed by the editor-only entry in `./index.tsx`; the public
 * render config omits it, so the published footer ships no click behaviour.
 */
export const renderLinkListBlock = ({
  content,
  layout,
  size,
  spacing,
  typography,
  editing,
  dragRef,
}: LinkListBlockRenderProps) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getSizeVars(size),
    ...getSpacingVars(spacing),
    ...getTypographyVars(typography),
  };

  return (
    <LinkListBlockUi
      title={content?.title}
      links={content?.links}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, { editing })}
      editing={editing}
      dragRef={dragRef}
    />
  );
};
