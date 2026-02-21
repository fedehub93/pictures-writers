import { TiptapContent, WebinarMetadata } from "@/types";
import { WebinarInfo } from "./webinar-info";
import { WebinarSummary } from "./webinar-summary";
import { ProductAcquisitionMode } from "@/generated/prisma";
import { FaqSection } from "@/components/faq-section";
import { Separator } from "@/components/ui/separator";
import { WebinarBottomCta } from "./webinar-bottom-cta";

interface WebinarProps {
  id: string;
  title: string;
  tiptapDescription: TiptapContent;
  image: { url: string; altText: string | null } | null;
  price: number | null;
  discountedPrice: number | null;
  acquisitionMode: ProductAcquisitionMode;
  data: WebinarMetadata;
  faqs: { question: string; answer: string }[];
}

export const Webinar = ({
  id,
  title,
  tiptapDescription,
  image,
  price,
  discountedPrice,
  acquisitionMode,
  data,
  faqs,
}: WebinarProps) => {
  return (
    <>
      <div className="col-span-2 grid grid-cols-12 gap-x-4 space-y-8">
        <div className="col-span-full lg:col-span-8 lg:w-11/12 flex flex-col space-y-8">
          <WebinarInfo
            title={title}
            imageCover={image}
            tiptapDescription={tiptapDescription}
          />
          <Separator />
          {faqs.length && <FaqSection faqs={faqs} />}
        </div>

        <div id="summary" className="col-span-full lg:col-span-4 relative">
          <WebinarSummary
            id={id}
            title={title}
            image={image}
            price={price}
            discountedPrice={discountedPrice}
            acquisitionMode={acquisitionMode}
            data={data}
            showCta
          />
        </div>
      </div>

      <WebinarBottomCta
        acquisitionMode={acquisitionMode}
        ctaLabel="Vai alla submission"
        price={price}
        discountedPrice={discountedPrice}
      />
    </>
  );
};
