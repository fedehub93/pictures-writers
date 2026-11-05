import "server-only";

import { getSettings } from "@/data/settings";

import type { BrandBlockProps } from "./types";
import { BrandBlockUi } from "./ui/brand";

/**
 * Server renderer for the Brand block.
 *
 * The site name and logo live in Installation settings, which are only
 * readable on the server. The editor config in `./index.tsx` stays
 * database-free so it can be imported by the client-side region editor.
 */
export const BrandServer = async ({
  showLogo,
  showSiteName,
  customText,
  customLogoUrl,
}: BrandBlockProps) => {
  const settings = await getSettings();

  return (
    <BrandBlockUi
      showLogo={showLogo}
      showSiteName={showSiteName}
      customText={customText}
      customLogoUrl={customLogoUrl}
      siteName={settings.siteName ?? undefined}
      logoUrl={settings.logoUrl ?? undefined}
    />
  );
};
