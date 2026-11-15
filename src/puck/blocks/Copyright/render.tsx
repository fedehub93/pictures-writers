import {
  getSizeVars,
  getSpacingVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";
import { getLayoutVars } from "@/puck/fields/layout/get-layout-vars";
import { getLayoutClassNames } from "@/puck/fields/layout/get-layout-classes";

import { COPYRIGHT_DEFAULT_TYPOGRAPHY } from "./defaults";
import type { CopyrightBlockRenderProps } from "./types";
import { CopyrightBlockUi } from "./ui/copyright";

/**
 * Pure render shared by the editor canvas and the public server renderer.
 *
 * The server renderer enriches the props with Installation settings; the editor
 * canvas receives the same value through Puck metadata. Neither path reads the
 * database here, so the block can be imported by the client-side region editor
 * safely.
 *
 * Explicit props win over metadata: the public site keeps rendering from the
 * server-provided values when both happen to be present.
 *
 * The typography fallback keeps previously saved documents at the small footer
 * type size: Puck merges `defaultProps` in the editor canvas only, not in the
 * public `<Render>`.
 */
export const renderCopyrightBlock = ({
  content,
  layout,
  size,
  spacing,
  typography,
  siteName,
  year,
  metadata,
  editing,
  dragRef,
}: CopyrightBlockRenderProps) => {
  const styleVars = {
    ...getLayoutVars(layout),
    ...getSizeVars(size),
    ...getSpacingVars(spacing),
    ...getTypographyVars(typography ?? COPYRIGHT_DEFAULT_TYPOGRAPHY),
  };

  return (
    <CopyrightBlockUi
      content={content}
      siteName={siteName?.trim() || metadata?.siteName}
      year={year}
      styleVars={styleVars}
      layoutClassName={getLayoutClassNames(layout, { editing })}
      editing={editing}
      dragRef={dragRef}
    />
  );
};
