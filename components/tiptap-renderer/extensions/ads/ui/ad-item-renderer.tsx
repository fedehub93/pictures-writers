import { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface AdItemRendererProps {
  imageSrc: string;
  title: string;
  description: string;
  href: string;
}

export const AdItemRenderer = ({
  imageSrc,
  title,
  description,
  href,
}: AdItemRendererProps) => {
  return (
    <div className="border rounded-md bg-primary-foreground flex flex-col overflow-hidden md:w-5/8 mx-auto items-center shadow-lg">
      <Image
        src={imageSrc}
        alt="Ads Box"
        width={1000}
        height={1000}
        className="object-cover"
      />
      <div className="p-4 flex flex-col gap-y-4">
        <div className="text-2xl text-primary font-semibold leading-8 text-center">
          {title}
        </div>
        <div className="text-base text-center">{description}</div>
        <Button asChild>
          <Link href={`${href}` as Route} className="text-xl font-light">
            Scopri di più
          </Link>
        </Button>
      </div>
    </div>
  );
};
