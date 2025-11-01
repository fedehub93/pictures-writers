import { TiptapContent, WebinarMetadata } from "@/types";
import { WebinarInfo } from "./webinar-info";
import { WebinarSummary } from "./webinar-summary";
import { ProductAcquisitionMode } from "@prisma/client";

interface WebinarProps {
  id: string;
  title: string;
  tiptapDescription: TiptapContent;
  image: { url: string; altText: string | null } | null;
  price: number | null;
  discountedPrice: number | null;
  acquisitionMode: ProductAcquisitionMode;
  data: WebinarMetadata;
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
}: WebinarProps) => {
  return (
    <div className="col-span-2 grid grid-cols-12 gap-x-4">
      <div className="col-span-8 w-11/12">
        <WebinarInfo title={title} tiptapDescription={tiptapDescription} />
      </div>
      <div className="col-span-4 relative">
        <WebinarSummary
          id={id}
          title={title}
          image={image}
          price={price}
          discountedPrice={discountedPrice}
          acquisitionMode={acquisitionMode}
          data={data}
        />
      </div>
    </div>
  );
};
