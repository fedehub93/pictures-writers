import type { CopyrightBlockUiProps } from "./types";
import { CopyrightBlockUi } from "./ui/copyright";

/**
 * Pure render shared by the editor canvas and the public server renderer.
 *
 * The editor path leaves `siteName` empty; the server renderer enriches the
 * props with Installation settings before calling this function. It imports
 * only the block UI, so the editor canvas stays database-free.
 */
export const renderCopyrightBlock = ({
  showYear,
  extraText,
  links,
  siteName,
  year,
}: CopyrightBlockUiProps) => (
  <CopyrightBlockUi
    showYear={showYear}
    extraText={extraText}
    links={links}
    siteName={siteName}
    year={year}
  />
);
