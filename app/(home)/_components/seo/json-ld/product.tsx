import React, { FC } from "react";
import { Product, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";
import { formatDate } from "@/lib/format";
import slugify from "slugify";

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
  reviews?: {
    reviewerName: string | null;
    rating: number;
    comment: string | null;
    date: Date;
  }[];
  aggregateRating?: {
    ratingValue: number;
    bestRating: number;
    ratingCount: number;
  };
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
  reviews,
  aggregateRating,
  images = [],
  videos = undefined,
  description,
}) => {
  const priceValidUntil = new Date();
  priceValidUntil.setMonth(priceValidUntil.getMonth() + 2);

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
    // Risolve il warning Brand
    brand: {
      "@type": "Brand",
      name: "Pictures Writers",
    },
    sku: slugify(title || "", { lower: true }),
    //@ts-ignore
    video: videos && videos.length > 0 ? [...videos] : undefined,
    review: reviews
      ? reviews.map((r) => ({
          "@type": "Review",
          reviewRating: {
            "@type": "Rating",
            ratingValue: r.rating,
          },
          author: r.reviewerName
            ? {
                "@type": "Person",
                name: r.reviewerName,
              }
            : undefined,
          reviewBody: r.comment ? r.comment : undefined,
          datePublished: formatDate({
            date: r.date,
            day: "numeric",
            month: "long",
          }),
        }))
      : undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ...aggregateRating,
    },
    offers: {
      "@type": offers.type,
      priceCurrency: offers.priceCurrency,
      price: offers.price,
      url: offers.url,
      availability: offers.availability,
      priceValidUntil: priceValidUntil.toISOString().split("T")[0],
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: "0",
          currency: "EUR",
        },
        deliveryTime: {
          "@type": "ShippingDeliveryTime",
          handlingTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
          transitTime: {
            "@type": "QuantitativeValue",
            minValue: 0,
            maxValue: 0,
            unitCode: "DAY",
          },
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: "IT",
        },
      },

      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: "IT",
        returnPolicyCategory: "https://schema.org/MerchantReturnNotPermitted",
      },
    },
    category,
    url,
  };

  return <JsonLd json={json} />;
};
