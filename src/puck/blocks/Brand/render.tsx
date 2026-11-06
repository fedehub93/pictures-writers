import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import { BRAND_DEFAULT_TYPOGRAPHY } from "./defaults";
import type { BrandBlockUiProps } from "./types";
import { BrandBlockUi } from "./ui/brand";

/**
 * Pure render shared by the editor canvas and the public server renderer.
 *
 * The editor path leaves `siteName` and `logoUrl` empty; the server renderer
 * enriches the props with Installation settings before calling this function.
 * It imports only the block UI and the shared style-variable utilities, so the
 * editor canvas stays database-free.
 *
 * The typography fallback keeps documents saved before the field existed at the
 * previous site-name size, weight and letter spacing: Puck merges
 * `defaultProps` in the editor canvas only, not in the public `<Render>`.
 */
export const renderBrandBlock = ({
  showLogo,
  showSiteName,
  customText,
  customLogoUrl,
  dimension,
  typography,
  siteName,
  logoUrl,
}: BrandBlockUiProps) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography ?? BRAND_DEFAULT_TYPOGRAPHY),
  };

  return (
    <BrandBlockUi
      showLogo={showLogo}
      showSiteName={showSiteName}
      customText={customText}
      customLogoUrl={customLogoUrl}
      siteName={siteName}
      logoUrl={logoUrl}
      styleVars={styleVars}
    />
  );
};
