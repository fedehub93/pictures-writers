"use client";

import { ServiceMetadata, TiptapContent } from "@/types";
import { ProductAcquisitionMode } from "@/generated/prisma";

import { FaqSection } from "@/components/faq-section";

import { ServiceInfo } from "./service-info";
import { ServiceBoxs } from "./service-boxs";
import { ServiceSample } from "./service-sample";

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

export const Service = ({ title, price, data, faqs }: ServiceProps) => {
  return (
    <div className="col-span-full">
      <ServiceInfo
        serviceType={data.serviceType}
        title={title}
        target={data.target}
        competitorPrice={data.competitorPrice}
        price={price ?? 0}
      />
      <ServiceBoxs features={data.features} />
      <ServiceSample attachamentUrl={data.attachamentUrl} />
      {!!faqs.length && <FaqSection faqs={faqs} />}
    </div>
  );
};
