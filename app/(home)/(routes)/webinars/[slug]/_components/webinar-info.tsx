"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  Hourglass,
  MonitorSmartphone,
  Sofa,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatPrice } from "@/lib/format";

import { FreeEbookModal } from "@/app/(home)/_components/modals/free-ebook-modal";
import { SlateRendererV2 } from "@/components/editor/view/slate-renderer";
import { Button } from "@/components/ui/button";
import { ProductBoxInfo } from "@/app/(home)/_components/product/product-box-info";

interface WebinarInfoProps {
  rootId: string;
  title: string;
  imageCoverUrl: string;
  description: PrismaJson.BodyData | null;
  price: number | null;
  discountedPrice: number | null;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    imageUrl: string;
  } | null;
  date?: Date | null;
  time?: string;
  seats?: number;
  duration?: string;
  platform?: string;
}

export const WebinarInfo = ({
  rootId,
  title,
  imageCoverUrl,
  description,
  price,
  discountedPrice,
  author,
  date,
  time,
  seats,
  duration,
  platform,
}: WebinarInfoProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col space-y-2">
      <div>
        <Badge>New</Badge>
      </div>
      <div>
        <h1 className="text-4xl">{title}</h1>
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
        <Button>Iscriviti</Button>
      </div>
      <Separator />
      <div className="flex flex-wrap gap-x-16 gap-y-4">
        <ProductBoxInfo
          label="Data"
          value={date ? formatDate({ date: date, month: "long" }) : ""}
          Icon={CalendarDays}
        />
        <ProductBoxInfo label="Ora" value={time!} Icon={Clock} />
        <ProductBoxInfo label="Durata" value={duration!} Icon={Hourglass} />
        <ProductBoxInfo label="Posti" value={seats!} Icon={Sofa} />
        <ProductBoxInfo
          label="Piattaforma"
          value={platform!}
          Icon={MonitorSmartphone}
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
