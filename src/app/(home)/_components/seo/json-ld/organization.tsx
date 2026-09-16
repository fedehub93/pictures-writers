import React, { FC } from "react";
import { Organization, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface OrganizationJsonLdProps {
  url: string;
  name: string;
  logo: string;
  sameAs?: string[];
}

export const OrganizationJsonLd: FC<OrganizationJsonLdProps> = ({
  name,
  url,
  logo,
  sameAs,
}) => {
  const json: WithContext<Organization> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    name,
    url,
    logo,
    ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
    founder: {
      "@type": "Person",
      name: "Federico Verrengia",
    },
    foundingDate: "2023",
  };

  return <JsonLd json={json} />;
};
