"use client";

import { useState } from "react";
import { User } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatBytes, formatDate, formatPrice } from "@/lib/format";
import { EbookFormat } from "@/types";

import { BuyButton } from "./buy-button";
import { BoxInfo } from "./box-info";
import { BookOpenText, CalendarDays, Earth, Weight } from "lucide-react";
import { FreeEbookModal } from "@/app/(home)/_components/modals/free-ebook-modal";
import AuthorWidget from "../../../[slug]/_components/author-widget";
import CustomSlateView from "@/components/editor/view";

interface EbookInfoProps {
  rootId: string;
  title: string;
  imageCoverUrl: string;
  description: PrismaJson.BodyData | null;
  price: number | null;
  discountedPrice: number | null;
  formats: EbookFormat[];
  author: User | null;
  edition?: string;
  publishedAt?: Date | null;
}

export const EbookInfo = ({
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
}: EbookInfoProps) => {
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
          {edition && <p className="text-muted-foreground text-sm">{edition}</p>}
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
        <CustomSlateView nodes={description!} />
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
      {/* <AuthorWidget
        firstName={author?.firstName!}
        lastName={author?.lastName!}
        imageUrl={author?.imageUrl!}
        bio={author?.bio!}
      /> */}
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
