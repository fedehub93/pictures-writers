"use client";
import Link from "next/link";
import { Route } from "next";
import {
  CalendarDays,
  Clock,
  Hourglass,
  MonitorSmartphone,
  Sofa,
} from "lucide-react";

import { ProductAcquisitionMode } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { formatDate, formatPrice } from "@/lib/format";

import { SlateRendererV2 } from "@/components/editor/view/slate-renderer";

import { ProductBoxInfo } from "@/app/(home)/_components/product/product-box-info";
import { BuyButton } from "@/components/checkout/buy-button";

interface WebinarInfoProps {
  id: string;
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
  date: Date | null;
  time: string;
  seats: number;
  availableSeats: number;
  duration: string;
  platform: string;
  acquisitionMode: ProductAcquisitionMode;
}

export const WebinarInfo = ({
  id,
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
  availableSeats,
  duration,
  platform,
  acquisitionMode,
}: WebinarInfoProps) => {
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
      <div className="flex mx-auto items-center">
        {availableSeats && acquisitionMode === ProductAcquisitionMode.PAID ? (
          <BuyButton productId={id} />
        ) : null}
        {acquisitionMode === ProductAcquisitionMode.FORM && (
          <Button type="button" asChild>
            <Link href={`submission` as Route}>Invia preselezione</Link>
          </Button>
        )}
        {!availableSeats && (
          <div className="text-foreground-primary text-2xl font-bold bg-destructive p-1 px-2 rounded-md">
            Posti esauriti
          </div>
        )}
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
    </div>
  );
};
