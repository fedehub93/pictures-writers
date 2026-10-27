import { INTEGRATION_PROVIDER_IUBENDA } from "../constants";
import { IubendaIntegrationForm } from "../../ui/components/providers/iubenda-form";
import { IubendaIcon } from "../../ui/components/providers/iubenda-icon";
import { iubendaConfigSchema } from "./iubenda-config";
import type { IntegrationProviderDescriptor } from "./types";

export const iubendaIntegrationDescriptor: IntegrationProviderDescriptor = {
  provider: INTEGRATION_PROVIDER_IUBENDA,
  presentation: {
    name: "Iubenda",
    description:
      "Cookie consent banner and Google Consent Mode for the public site.",
    Icon: IubendaIcon,
  },
  configSchema: iubendaConfigSchema,
  secretFields: [],
  affectsPublicSite: true,
  isReady: ({ config }) => iubendaConfigSchema.safeParse(config).success,
  adminForm: IubendaIntegrationForm,
};
