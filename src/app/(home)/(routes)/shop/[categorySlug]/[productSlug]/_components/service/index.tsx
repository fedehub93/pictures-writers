"use client";

import { ServiceMetadata, TiptapContent } from "@/types";
import { ProductAcquisitionMode } from "@/generated/prisma";

import { FaqSection } from "@/shared/components/faq-section";

import { ServiceInfo } from "./service-info";
import { ServiceBoxs } from "./service-boxs";
import { ServiceSample } from "./service-sample";
import { ServiceCtaBand } from "./service-cta-band";
import { ProductBottomCta } from "../product-bottom-cta";

interface ServiceProps {
  id: string;
  title: string;
  tiptapDescription: TiptapContent;
  image: { url: string; altText: string | null } | null;
  price: number | null;
  discountedPrice: number | null;
  acquisitionMode: ProductAcquisitionMode;
  data: ServiceMetadata;
  faqs: { question: string; answer: string }[];
}

export const Service = ({
  title,
  price,
  discountedPrice,
  acquisitionMode,
  data,
  faqs,
}: ServiceProps) => {
  return (
    <>
      <div className="col-span-full pb-24 lg:pb-0">
        <ServiceInfo
          serviceType={data.serviceType}
          title={title}
          target={data.target}
          competitorPrice={data.competitorPrice}
          price={price ?? 0}
        />
        <ServiceBoxs features={data.features} />
        <ServiceCtaBand variant="mid" price={price} />
        <ServiceSample attachamentUrl={data.attachamentUrl} />
        {!!faqs.length && <FaqSection faqs={faqs} />}
        <ServiceCtaBand variant="final" price={price} />
      </div>
      <ProductBottomCta
        acquisitionMode={acquisitionMode}
        ctaLabel="Richiedi la tua analisi"
        price={price}
        discountedPrice={discountedPrice}
      />
    </>
  );
};