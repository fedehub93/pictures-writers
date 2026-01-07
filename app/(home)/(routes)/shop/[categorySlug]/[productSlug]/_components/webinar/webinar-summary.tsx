import { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, Euro, Sofa } from "lucide-react";

import { ProductAcquisitionMode } from "@/prisma/generated/client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { formatDate, formatPrice } from "@/lib/format";
import { WebinarMetadata } from "@/types";

import { BuyButton } from "@/components/checkout/buy-button";

interface WebinarSummaryProps {
  id: string;
  title: string;
  image: { url: string; altText: string | null } | null;
  price: number | null;
  discountedPrice: number | null;
  acquisitionMode: ProductAcquisitionMode;
  data: WebinarMetadata;
  showCta?: boolean;
}

export const WebinarSummary = ({
  id,
  title,
  image,
  price,
  discountedPrice,
  acquisitionMode,
  data,
  showCta = false,
}: WebinarSummaryProps) => {
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
          <div className="font-medium text-lg ">{title}</div>
        </div>
        <Separator />
        <div className="flex flex-col space-y-2">
          <div className="flex flex-col">
            <div className="flex gap-x-2 items-center mb-2">
              <Euro className="size-5" />
              <div className="font-semibold">Costo</div>
            </div>
            {acquisitionMode === ProductAcquisitionMode.FORM && (
              <div className="flex items-center justify-between">
                <p className="text-sm">Preselezione</p>
                <span className="text-base font-bold text-primary">
                  Gratuito
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-sm">Iscrizione</p>
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
          <Separator />
          {Array.isArray(data.lessons) && data.lessons.length > 0 && (
            <div className="flex flex-col space-y-2">
              <div className="flex gap-x-2 items-center mb-1">
                <CalendarDays className="size-5" />
                <div className="font-semibold">Calendario lezioni</div>
              </div>

              <ul className="space-y-1 pt-2 text-sm">
                {data.lessons.map((lesson: any, index: number) => (
                  <li key={index} className="flex items-center justify-between">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-foreground min-w-20">
                        {formatDate({
                          date: lesson.date,
                          month: "short",
                        })}
                      </span>{" "}
                      <div className="h-[0.5px] bg-muted w-20" />
                      {lesson.startTime} – {lesson.endTime}
                      {lesson.title && (
                        <span className="italic text-muted-foreground ml-1">
                          ({lesson.title})
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {showCta && (
                <>
                  <Separator />
                  <div className="flex mx-auto items-center mt-2">
                    {acquisitionMode === ProductAcquisitionMode.PAID ? (
                      <BuyButton productId={id} />
                    ) : null}
                    {acquisitionMode === ProductAcquisitionMode.FORM && (
                      <Button type="button" asChild>
                        <Link href={`submission` as Route}>
                          Vai alla submission
                        </Link>
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
