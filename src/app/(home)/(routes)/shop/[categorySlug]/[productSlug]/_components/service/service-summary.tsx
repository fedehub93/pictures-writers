import Image from "next/image";
import { EuroIcon, HelpCircleIcon } from "lucide-react";

import { Separator } from "@/components/ui/separator";

import { formatPrice } from "@/lib/format";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ServiceSummaryProps {
  id: string;
  title: string;
  image: { url: string; altText: string | null } | null;
  price: number | null;
  discountedPrice: number | null;
  faqs: { question: string; answer: string }[];
}

export const ServiceSummary = ({
  id,
  title,
  image,
  price,
  discountedPrice,
  faqs,
}: ServiceSummaryProps) => {
  return (
    <div className="w-full flex flex-col gap-y-4 sticky top-24">
      <div className="bg-card border rounded-lg p-6 py-4 w-full flex flex-col space-y-2 shadow">
        <div className="flex flex-col items-center w-full space-y-2">
          {image && (
            <Image
              src={image.url}
              alt={image.altText || ""}
              width={500}
              height={500}
              className="aspect-video object-cover"
            />
          )}
          {!image && (
            <Image
              src="/feedback-pana.png"
              alt="Feedback da servizi di editing"
              width={250}
              height={250}
              className="object-cover scale-110"
            />
          )}
          <div className="font-medium text-xl ">{title}</div>
        </div>
        <Separator />
        <div className="flex flex-col space-y-2">
          <div className="flex flex-col">
            <div className="flex gap-x-2 items-center mb-2">
              <EuroIcon className="size-5" />
              <span>Costo</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm">Editing</p>
              {price !== discountedPrice && (
                <span className="text-xs line-through text-black">
                  {formatPrice(discountedPrice!, true)}
                </span>
              )}
              <span className="text-base text-primary">
                {formatPrice(price!, true)}
              </span>
            </div>
          </div>
        </div>
        <Separator />
        <div className="mt-2 flex flex-col space-y-2">
          <div className="flex gap-x-2 items-center mb-2">
            <HelpCircleIcon className="size-5" />
            <span>FAQs</span>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                value={`item-${index}`}
                key={faq.question}
                className="bg-muted mb-2 rounded-md border px-2"
              >
                <AccordionTrigger className="font-semibold text-sm text-left gap-x-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-accent-foreground text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </div>
  );
};
