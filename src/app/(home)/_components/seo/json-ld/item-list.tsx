import React, { FC } from "react";
import { ItemList, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface ItemListJsonLdProps {
  items: {
    title: string;
    url: string;
  }[];
}

export const ItemListJsonLd: FC<ItemListJsonLdProps> = ({ items }) => {
  if (items.length === 0) {
    return null;
  }

  const json: WithContext<ItemList> = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: item.url,
    })),
  };

  return <JsonLd json={json} />;
};