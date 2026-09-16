import React, { FC } from "react";
import { BreadcrumbList, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface BreadcrumbListJsonLdProps {
  items: {
    title: string;
    href: string;
  }[];
}

export const BreadcrumbListJsonLd: FC<BreadcrumbListJsonLdProps> = ({
  items,
}) => {
  const json: WithContext<BreadcrumbList> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      item: item.href,
    })),
  };

  return <JsonLd json={json} />;
};