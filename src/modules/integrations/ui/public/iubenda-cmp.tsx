import type { IubendaConfig } from "@/modules/integrations/lib/providers/iubenda-config";

const IUBENDA_RUNTIME_URL = "https://cdn.iubenda.com/cs/iubenda_cs.js";

function buildConfigurationScript(config: IubendaConfig): string {
  const payload = JSON.stringify({
    siteId: Number(config.siteId),
    cookiePolicyId: Number(config.cookiePolicyId),
    lang: config.lang,
    googleConsentMode: config.consentMode,
  }).replace(/</g, "\\u003c");

  return `var _iub = _iub || [];\n_iub.csConfiguration = ${payload};`;
}

function loaderUrl(config: IubendaConfig): string {
  const siteId = Number(config.siteId);
  return config.autoblocking
    ? `https://cs.iubenda.com/autoblocking/${siteId}.js`
    : `https://cs.iubenda.com/sync/${siteId}.js`;
}

/**
 * Iubenda Consent Management Platform, rendered as raw inline scripts so the
 * document order is explicit: configuration, loader, runtime. The runtime is
 * asynchronous; the loader is intentionally not, because autoblocking must
 * block the DOM before other third parties load.
 */
export const IubendaCmp = ({ config }: { config: IubendaConfig | null }) => {
  if (!config) return null;

  return (
    <>
      <script
        id="iubenda-configuration"
        type="text/javascript"
        dangerouslySetInnerHTML={{ __html: buildConfigurationScript(config) }}
      />
      {/* Iubenda's autoblocking loader must run before other DOM resources; it
          cannot be async or deferred. */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <script
        id="iubenda-loader"
        type="text/javascript"
        src={loaderUrl(config)}
      />
      {/* React 19 hoists async scripts to the top of the document. Giving the
          tag an itemProp keeps it where it is written, after the configuration
          and loader, while still loading asynchronously. */}
      <script
        id="iubenda-runtime"
        type="text/javascript"
        async
        itemProp="iubenda-runtime"
        src={IUBENDA_RUNTIME_URL}
      />
    </>
  );
};
