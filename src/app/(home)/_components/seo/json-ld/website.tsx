import React, { FC } from "react";
import { WebSite, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface WebSiteJsonLdProps {
  url: string;
  name: string;
  description?: string;
}

export const WebSiteJsonLd: FC<WebSiteJsonLdProps> = ({
  url,
  name,
  description,
}) => {
  const json: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}#website`,
    name,
    description,
    url,
    inLanguage: "it-IT",
    publisher: {
      "@type": "Organization",
      "@id": `${url}#organization`,
      name,
      url,
      logo: {
        "@type": "ImageObject",
        url: `${url}logo.png`,
      },
    },
  };

  return <JsonLd json={json} />;
};