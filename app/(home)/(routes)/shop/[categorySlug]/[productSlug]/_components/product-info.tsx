"use client";

import { useState } from "react";
import { BookOpenText, CalendarDays, Earth, Weight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatBytes, formatDate, formatPrice } from "@/lib/format";
import { EbookFormat } from "@/types";

import { FreeEbookModal } from "@/app/(home)/_components/modals/free-ebook-modal";
import { SlateRendererV2 } from "@/components/editor/view/slate-renderer";
import { BuyButton } from "./buy-button";
import { BoxInfo } from "./box-info";

interface ProductInfoProps {
  rootId: string;
  title: string;
  imageCoverUrl: string;
  description: PrismaJson.BodyData | null;
  price: number | null;
  discountedPrice: number | null;
  formats: EbookFormat[];
  author: {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  } | null;
  edition?: string;
  publishedAt?: Date | null;
}

export const ProductInfo = ({
  rootId,
  title,
  imageCoverUrl,
  description,
  price,
  discountedPrice,
  formats,
  publishedAt,
  author,
  edition,
}: ProductInfoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-2">
      <div>
        <Badge>Scaricato più di 200 volte</Badge>
      </div>
      <div>
        <h1 className="text-4xl">{title}</h1>
        <div className="flex justify-between">
          <p className="text-muted-foreground text-sm">
            di {author?.firstName} {author?.lastName}
          </p>
          {edition && (
            <p className="text-muted-foreground text-sm">{edition}</p>
          )}
        </div>
      </div>
      <div>
        {price !== discountedPrice && (
          <span className="text-xs line-through text-black">
            {formatPrice(discountedPrice!, true)}
          </span>
        )}
        <span className="text-xl font-extrabold text-primary">
          {formatPrice(price!, true)}
        </span>
      </div>
      <Separator />
      <div>
        <SlateRendererV2 content={description!} />
      </div>
      <Separator />
      <div className="flex justify-between items-center">
        <p>
          Formato: <span className="font-bold">PDF</span>
        </p>
        <BuyButton setIsOpen={setIsOpen} />
      </div>
      <Separator />
      <div className="flex flex-wrap gap-x-16 gap-y-4">
        <BoxInfo
          label="Lunghezza"
          value={`${formats[0].pages} pagine`}
          Icon={BookOpenText}
        />
        <BoxInfo label="Lingua" value="Italiano" Icon={Earth} />
        <BoxInfo
          label="Pubblicazione"
          value={
            publishedAt ? formatDate({ date: publishedAt, month: "short" }) : ""
          }
          Icon={CalendarDays}
        />
        <BoxInfo
          label="Dimensione"
          value={formatBytes(formats[0].size)}
          Icon={Weight}
        />
      </div>
      <Separator />
      <FreeEbookModal
        rootId={rootId}
        title={title}
        imageCoverUrl={imageCoverUrl}
        isOpen={isOpen}
        setIsOpen={setIsOpen}
      />
    </div>
  );
};
