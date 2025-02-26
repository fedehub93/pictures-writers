import Link from "next/link";
import Image from "next/image";

import { ProductWithImageCoverAndAuthor } from "@/types";
import { isWebinarMetadata } from "@/type-guards";

import { formatDate, formatPrice } from "@/lib/format";
import { CalendarDays, Clock, Euro, Hourglass, Sofa } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WebinarsListProps {
  webinars: ProductWithImageCoverAndAuthor[];
  totalPages: number;
  currentPage: number;
}

export const WebinarsList = ({ webinars }: WebinarsListProps) => {
  return (
    <div className="flex flex-col items-center lg:items-start lg:flex-row">
      {webinars.map((webinar) => {
        if (!isWebinarMetadata(webinar.metadata)) return;

        return (
          <div
            key={webinar.title}
            className="flex flex-col justify-center items-center w-80 border rounded-lg overflow-hidden shadow-lg "
          >
            <div className="w-full border-b flex items-center justify-center group overflow-hidden">
              <Link
                href={`/webinars/${webinar.slug}`}
                className="group-hover:scale-105 transition-all duration-700 "
              >
                <Image
                  src={webinar.imageCover?.url!}
                  alt={webinar.imageCover?.altText!}
                  className="shadow-md group-hover:shadow-xl transition-all duration-700"
                  width={1280}
                  height={720}
                />
              </Link>
            </div>
            <div className="p-4 flex flex-col gap-y-6 text-center">
              <Link
                href={`/webinars/${webinar.slug}`}
                className="font-bold text-lg leading-5 hover:text-primary"
              >
                {webinar.title}
              </Link>
              <div className="flex flex-col gap-y-2 text-sm text-muted-foreground">
                <div className="grid grid-cols-2 gap-x-4 ">
                  <div className="flex items-center gap-x-2">
                    <CalendarDays className="w-4 h-4" />
                    {formatDate({
                      date: webinar.metadata.date!,
                    })}
                  </div>
                  <div className="flex items-center gap-x-2">
                    <Clock className="h-4 w-4" />
                    Ora: {webinar.metadata.time}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="flex items-center gap-x-2">
                    <Hourglass className="w-4 h-4" />
                    Durata: {webinar.metadata.duration}
                  </div>
                  <div className="flex items-center gap-x-2">
                    <Sofa className="h-4 w-4" />
                    Posti: {webinar.metadata.seats}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="flex items-center gap-x-2">
                    <Euro className="h-4 w-4" />
                    Costo: {formatPrice(webinar.price!, true)}
                  </div>
                </div>
              </div>
              <div className="flex flex-col text-xl font-extrabold">
                <Button asChild size="sm" className="w-1/2 self-center">
                  <Link href={`/webinars/${webinar.slug}`}>Scopri</Link>
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
