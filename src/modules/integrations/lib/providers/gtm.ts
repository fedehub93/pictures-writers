import { INTEGRATION_PROVIDER_GTM } from "../constants";
import { GtmIntegrationForm } from "../../ui/components/providers/gtm-form";
import { GtmIcon } from "../../ui/components/providers/gtm-icon";
import { gtmConfigSchema } from "./gtm-config";
import type { IntegrationProviderDescriptor } from "./types";

export const gtmIntegrationDescriptor: IntegrationProviderDescriptor = {
  provider: INTEGRATION_PROVIDER_GTM,
  presentation: {
    name: "Google Tag Manager",
    description:
      "Tag container that loads analytics and marketing tags on the public site.",
    Icon: GtmIcon,
  },
  configSchema: gtmConfigSchema,
  secretFields: [],
  affectsPublicSite: true,
  isReady: ({ config }) => gtmConfigSchema.safeParse(config).success,
  adminForm: GtmIntegrationForm,
};
