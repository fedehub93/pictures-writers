import Link from "next/link";
import Image from "next/image";

import { Button } from "@/shared/ui/button";

import { cn } from "@/shared/lib/utils";
import { getLessonRange, getPurchasedWebinar } from "@/data/webinars";
import { formatDate, formatPrice } from "@/lib/format";
import { WebinarLesson } from "@/types";

interface WebinarCardProps {
  rootId: string;
  title: string;
  categorySlug: string;
  slug: string;
  imageCover: { url: string; altText: string | null } | null;
  seats: number;
  price: number;
  discountedPrice: number | null;
  lessons: WebinarLesson[];
  isOpen: boolean;
}

export const WebinarCard = async ({
  rootId,
  title,
  categorySlug,
  slug,
  imageCover,
  seats,
  price,
  discountedPrice,
  lessons,
  isOpen,
}: WebinarCardProps) => {
  const purchasedWebinar = await getPurchasedWebinar(rootId!);
  // const availableSeats = seats - purchasedWebinar;
  const href = `/shop/${categorySlug}/${slug}` as const;

  const { start, end } = getLessonRange(lessons);
  // if (!start || !end) return null;

  return (
    <div
      key={title}
      className="flex flex-col justify-center items-center w-80 border rounded-lg relative shadow-lg bg-foreground-primary mt-4"
    >
      <div
        className={cn(
          "absolute -top-6 left-2 text-sm bg-primary pt-1 px-2 text-primary-foreground rounded-t-lg font-bold",
          !isOpen && "bg-destructive",
        )}
      >
        {!isOpen ? "Chiuso" : "Aperto"}
      </div>
      <div className="w-full border-b flex items-center justify-center group rounded-lg overflow-hidden">
        <Link
          href={href}
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
      <div className="p-4 flex flex-col gap-y-4 text-center">
        <div className="font-bold text-lg leading-5">{title}</div>
        {isOpen && start && end && (
          <div className="flex flex-col gap-y-2 text-sm text-muted-foreground">
            <div className="text-sm text-muted-foreground mb-2">
              Dal{" "}
              <span className="text-foreground font-medium">
                {formatDate({ date: start, month: "long" })}
              </span>{" "}
              al{" "}
              <span className="text-foreground font-medium">
                {formatDate({ date: end, month: "long" })}
              </span>
            </div>
            <div>
              {price !== discountedPrice && (
                <span className="text-xs line-through text-black">
                  {formatPrice(discountedPrice!, true)}
                </span>
              )}
              <span className="text-xl font-bold text-primary">
                {formatPrice(price!, true)}
              </span>
            </div>
          </div>
        )}
        <div className="flex flex-col text-xl font-bold">
          <Button asChild type="button" className="bg-foreground">
            <Link href={href} prefetch>
              {isOpen ? "Scopri" : "Iscriviti alla lista d'attesa"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};
