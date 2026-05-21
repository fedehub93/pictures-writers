import React, { FC } from "react";
import { Organization, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface OrganizationJsonLdProps {
  url: string;
  name: string;
  logo: string;
}

export const OrganizationJsonLd: FC<OrganizationJsonLdProps> = ({
  name,
  url,
  logo,
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
    founder: {
      "@type": "Person",
      name: "Federico verrengia",
    },
    foundingDate: "2023",
  };

  return <JsonLd json={json} />;
};
