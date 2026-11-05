import { requireAdminAuth } from "@/shared/lib/auth-utils";

import { SITE_REGION_KEYS } from "@/modules/site-regions/constants";
import { toSiteRegionSummary } from "@/modules/site-regions/lib/region-presentation";
import { getRegionWithVersions } from "@/modules/site-regions/server/queries";
import { SiteRegionsView } from "@/modules/site-regions/ui/views/site-regions-view";

const SiteRegionsPage = async () => {
  await requireAdminAuth();

  const regions = await Promise.all(
    SITE_REGION_KEYS.map(async (key) => {
      const region = await getRegionWithVersions(key);
      return toSiteRegionSummary(key, region);
    }),
  );

  return <SiteRegionsView regions={regions} />;
};

export default SiteRegionsPage;
