import {
  getDimensionVars,
  getTypographyVars,
} from "@/puck/utils/get-style-vars";

import { BRAND_DEFAULT_TYPOGRAPHY } from "./defaults";
import type { BrandBlockRenderProps } from "./types";
import { BrandBlockUi } from "./ui/brand";

/**
 * Pure render shared by the editor canvas and the public server renderer.
 *
 * The server renderer enriches the props with Installation settings; the
 * editor canvas receives the same values through Puck metadata. Neither path
 * reads the database here, so the block can be imported by the client-side
 * region editor safely.
 *
 * Explicit props win over metadata: the public site keeps rendering from the
 * server-provided values when both happen to be present.
 *
 * The typography fallback keeps documents saved before the field existed at the
 * previous site-name size, weight and letter spacing: Puck merges
 * `defaultProps` in the editor canvas only, not in the public `<Render>`.
 */
export const renderBrandBlock = ({
  content,
  dimension,
  typography,
  siteName,
  logoUrl,
  metadata,
}: BrandBlockRenderProps) => {
  const styleVars = {
    ...getDimensionVars(dimension),
    ...getTypographyVars(typography ?? BRAND_DEFAULT_TYPOGRAPHY),
  };

  return (
    <BrandBlockUi
      content={content}
      siteName={siteName?.trim() || metadata?.siteName}
      logoUrl={logoUrl?.trim() || metadata?.logoUrl}
      styleVars={styleVars}
    />
  );
};
