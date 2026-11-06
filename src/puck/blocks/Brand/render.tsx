import type { BrandBlockUiProps } from "./types";
import { BrandBlockUi } from "./ui/brand";

/**
 * Pure render shared by the editor canvas and the public server renderer.
 *
 * The editor path leaves `siteName` and `logoUrl` empty; the server renderer
 * enriches the props with Installation settings before calling this function.
 * It imports only the block UI, so the editor canvas stays database-free.
 */
export const renderBrandBlock = ({
  showLogo,
  showSiteName,
  customText,
  customLogoUrl,
  siteName,
  logoUrl,
}: BrandBlockUiProps) => (
  <BrandBlockUi
    showLogo={showLogo}
    showSiteName={showSiteName}
    customText={customText}
    customLogoUrl={customLogoUrl}
    siteName={siteName}
    logoUrl={logoUrl}
  />
);
