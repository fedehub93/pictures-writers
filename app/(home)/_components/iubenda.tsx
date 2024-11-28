import Script from "next/script";

export default function IubendaScript() {
  return (
    <>
      {/* Configurazione inline dello script */}
      <Script id="iubenda-config" strategy="afterInteractive">
        {`
          var _iub = _iub || [];
          _iub.csConfiguration = {
            "siteId": 3303495,
            "cookiePolicyId": 49078580,
            "lang": "it",
            "storage": {"useSiteId": true}
          };
        `}
      </Script>

      {/* Script di sincronizzazione */}
      <Script src="//cs.iubenda.com/sync/3303495.js" strategy="lazyOnload" />

      {/* Script principale di iubenda */}
      <Script src="//cdn.iubenda.com/cs/iubenda_cs.js" strategy="lazyOnload" />
    </>
  );
}
