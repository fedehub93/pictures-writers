"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";

import { cn } from "@/lib/utils";
import { Gallery } from "@/types";

interface ProductGalleryProps {
  gallery: Gallery[];
}

export const ProductGallery = ({ gallery }: ProductGalleryProps) => {
  const [api, setApi] = useState<CarouselApi>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const onHandleClick = (i: number) => {
    setSelectedImageIndex(i);
  };

  useEffect(() => {
    if (!api) {
      return;
    }

    api.on("select", () => setSelectedImageIndex(api.selectedScrollSnap()));
  }, [api]);

  return (
    <div className="relative">
      <div className="flex flex-col gap-y-4 sticky top-20">
        <Carousel setApi={setApi}>
          <CarouselContent>
            {gallery.map((g, i) => (
              <CarouselItem
                key={g.media.altText}
                className="relative p-8 w-full"
              >
                <Image
                  src={g.media.url!}
                  alt={g.media.altText!}
                  height={600}
                  width={600}
                  className="object-contain max-h-[600px]"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        <Carousel className="w-4/5 mx-auto">
          <CarouselContent>
            {gallery.map((g, i) => (
              <CarouselItem
                key={g.media.altText}
                className="basis-1/3 lg:basis-1/5"
                onClick={() => api?.scrollTo(i)}
              >
                <Card
                  className={cn(
                    "shadow-lg my-4 cursor-pointer",
                    selectedImageIndex === i && "border-primary border-2"
                  )}
                  onClick={() => onHandleClick(i)}
                >
                  <CardContent className="relative flex aspect-square items-center justify-center p-0 ">
                    <Image
                      src={g.media.url}
                      fill
                      sizes="10vw"
                      className="object-contain"
                      alt={g.media.altText!}
                    />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </div>
    </div>
  );
};
