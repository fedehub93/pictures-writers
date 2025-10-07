import React, { FC } from "react";
import { Product, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface ProductJsonLdProps {
  url: string;
  title?: string;
  offers: {
    type: "Offer";
    priceCurrency: string;
    price: string;
    url: string;
    availability: "https://schema.org/InStock";
  };
  category?: string;
  keywords?: string | string[];
  images: string[];
  videos?: string[];
  datePublished: string;
  dateCreated?: string;
  dateModified?: string;
  authorName: string;
  authorType?: "Person" | "Organization";
  description: string;
  body?: string;
}

export const ProductJsonLd: FC<ProductJsonLdProps> = ({
  url,
  title,
  offers,
  category,
  images = [],
  videos = undefined,
  description,
}) => {
  const json: WithContext<Product> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    name: title,
    description: description,
    image: [...images],
    //@ts-ignore
    video: videos && videos.length > 0 ? [...videos] : undefined,
    offers: {
      "@type": offers.type,
      priceCurrency: offers.priceCurrency,
      price: offers.price,
      url: offers.url,
      availability: offers.availability,
    },
    category,
    url,
  };

  return <JsonLd json={json} />;
};
