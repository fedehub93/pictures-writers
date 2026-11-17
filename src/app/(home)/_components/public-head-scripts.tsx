import { GoogleTagManager } from "@next/third-parties/google";

import type { IubendaConfig } from "@/modules/integrations/lib/providers/iubenda-config";
import { IubendaCmp } from "@/modules/integrations/ui/public/iubenda-cmp";

interface PublicHeadScriptsProps {
  iubendaConfig: IubendaConfig | null;
  gtmId?: string;
}

/**
 * Third-party scripts for the public document, rendered at the top of `<body>`
 * rather than in `<head>`. Iubenda's runtime inserts its core script before the
 * first `<script>` in the document, and React 19 hydrates a JSX `<head>`
 * positionally, so that insertion would break hydration (ADR 0031). The CMP is
 * a raw inline block so its position is fixed; GTM stays afterInteractive and
 * always comes after it.
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
