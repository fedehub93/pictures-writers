import React, { FC } from "react";
import { FAQPage, WithContext } from "schema-dts";
import { JsonLd } from "./json-ld";

export interface FaqPageJsonLdProps {
  mainEntity: {
    question: string;
    answer: string;
  }[];
}

export const FaqPageJsonLd: FC<FaqPageJsonLdProps> = ({ mainEntity }) => {
  if (mainEntity.length === 0) {
    return null;
  }

  const json: WithContext<FAQPage> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: mainEntity.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return <JsonLd json={json} />;
};