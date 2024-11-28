/* eslint-disable react/require-default-props */
import React, { FC } from "react";
import { Media } from "@prisma/client";
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
  imageCover: Media | null;
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
  imageCover,
  images = [],
  videos = undefined,
  description,
}) => {
  const trailingUrl = `${url}/`;
  const json: WithContext<Product> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${trailingUrl}#product`,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": trailingUrl,
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
  };

  return <JsonLd json={json} />;
};
