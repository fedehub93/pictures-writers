import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import { COPYRIGHT_DEFAULT_TYPOGRAPHY } from "./defaults";
import type { CopyrightBlockUiProps } from "./types";
import { CopyrightBlockUi } from "./ui/copyright";

/**
 * Pure render shared by the editor canvas and the public server renderer.
 *
 * The editor path leaves `siteName` empty; the server renderer enriches the
 * props with Installation settings before calling this function. It imports
 * only the block UI and the shared style-variable utilities, so the editor
 * canvas stays database-free.
 *
 * The typography fallback keeps previously saved documents at the small footer
 * type size: Puck merges `defaultProps` in the editor canvas only, not in the
 * public `<Render>`.
 */
export const renderCopyrightBlock = ({
  showYear,
  extraText,
  links,
  dimension,
  typography,
  siteName,
  year,
}: CopyrightBlockUiProps) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography ?? COPYRIGHT_DEFAULT_TYPOGRAPHY),
  };

  return (
    <CopyrightBlockUi
      showYear={showYear}
      extraText={extraText}
      links={links}
      siteName={siteName}
      year={year}
      styleVars={styleVars}
    />
  );
};
