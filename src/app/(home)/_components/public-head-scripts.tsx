import { GoogleTagManager } from "@next/third-parties/google";

import type { IubendaConfig } from "@/modules/integrations/lib/providers/iubenda-config";
import { IubendaCmp } from "@/modules/integrations/ui/public/iubenda-cmp";

interface PublicHeadScriptsProps {
  iubendaConfig: IubendaConfig | null;
  gtmId?: string;
}

/**
 * Third-party scripts rendered in the public document head. The CMP is a raw
 * inline block so its position is fixed; GTM stays afterInteractive and always
 * comes after it.
 */
export const PublicHeadScripts = ({
  iubendaConfig,
  gtmId,
}: PublicHeadScriptsProps) => (
  <>
    <IubendaCmp config={iubendaConfig} />
    {gtmId ? <GoogleTagManager gtmId={gtmId} /> : null}
  </>
);
