import React, { FC } from "react";
import { Organization, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";
import { CONTACT_EMAIL } from "@/constants";

export interface OrganizationJsonLdProps {
  url: string;
  name: string;
  logo: string;
  description?: string;
  sameAs?: string[];
}

export const OrganizationJsonLd: FC<OrganizationJsonLdProps> = ({
  name,
  url,
  logo,
  description,
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
    ...(description ? { description } : {}),
    ...(sameAs && sameAs.length > 0 ? { sameAs } : {}),
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      availableLanguage: ["it"],
    },
    address: {
      "@type": "PostalAddress",
      addressCountry: "IT",
    },
    founder: {
      "@type": "Person",
      name: "Federico Verrengia",
    },
    foundingDate: "2023",
  };

  return <JsonLd json={json} />;
};
