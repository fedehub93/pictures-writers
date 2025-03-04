import Link from "next/link";
import Image from "next/image";
import { CalendarDays, Clock, Euro, Hourglass, Sofa } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { getPurchasedWebinar } from "@/data/webinars";

interface WebinarCardProps {
  rootId: string;
  title: string;
  categorySlug: string;
  slug: string;
  imageCover: { url: string; altText: string | null } | null;
  date: Date | null;
  time: string;
  duration: string;
  seats: number;
  price: number;
}

export const WebinarCard = async ({
  rootId,
  title,
  categorySlug,
  slug,
  imageCover,
  date,
  time,
  duration,
  seats,
  price,
}: WebinarCardProps) => {
  const purchasedWebinar = await getPurchasedWebinar(rootId!);
  const availableSeats = seats - purchasedWebinar;
  return (
    <div
      key={title}
      className="flex flex-col justify-center items-center w-80 border rounded-lg relative shadow-lg bg-white"
    >
      <div
        className={cn(
          "absolute -top-6 left-2 text-sm bg-primary pt-1 px-2 text-white rounded-t-lg font-bold",
          availableSeats < 1 && "bg-destructive"
        )}
      >
        {availableSeats < 1 ? "Esaurito" : "Aperto"}
      </div>
      <div className="w-full border-b flex items-center justify-center group rounded-lg overflow-hidden">
        <Link
          href={`/shop/${categorySlug}/${slug}/`}
          className="group-hover:scale-105 transition-all duration-700 "
        >
          <Image
            src={imageCover?.url!}
            alt={imageCover?.altText!}
            className="shadow-md group-hover:shadow-xl transition-all duration-700"
            width={1280}
            height={720}
          />
        </Link>
      </div>
      <div className="p-4 flex flex-col gap-y-6 text-center">
        <div className="font-bold text-lg leading-5">{title}</div>
        <div className="flex flex-col gap-y-2 text-sm text-muted-foreground">
          <div className="grid grid-cols-2 gap-x-4 ">
            <div className="flex items-center gap-x-2">
              <CalendarDays className="w-4 h-4" />
              {formatDate({
                date: date!,
              })}
            </div>
            <div className="flex items-center gap-x-2">
              <Clock className="h-4 w-4" />
              Ora: {time}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="flex items-center gap-x-2">
              <Hourglass className="w-4 h-4" />
              Durata: {duration}
            </div>
            <div className="flex items-center gap-x-2">
              <Euro className="h-4 w-4" />
              Costo: {formatPrice(price!, true)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <div className="flex items-center gap-x-2">
              <Sofa className="h-4 w-4" />
              Posti: {seats}
            </div>
            <div
              className={cn(
                "flex items-center gap-x-2 text-primary underline font-semibold",
                availableSeats < 1 && "text-destructive"
              )}
            >
              <Sofa className="h-4 w-4" />
              Disponibili: {availableSeats}
            </div>
          </div>
        </div>
        <div className="flex flex-col text-xl font-extrabold">
          <Button asChild size="sm" className="w-1/2 self-center">
            <Link href={`/shop/${categorySlug}/${slug}/`} prefetch={true}>
              Scopri
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
