import React from "react";
import Link from "next/link";
import Image from "next/image";

import { getPublishedEbookBySlug } from "@/data/ebook";

const SidebarEbook = async () => {
  const ebook = await getPublishedEbookBySlug(
    "introduzione-alla-sceneggiatura"
  );

  if (!ebook) {
    return null;
  }

  return (
    <div className="relative w-full bg-white px-6 py-8 shadow-md flex flex-col gap-y-4">
      <h3 className="text-sm font-extrabold uppercase mb-2">Ebook gratuito</h3>
      <Link href={`/ebooks/${ebook.slug}`} className="group">
        <Image
          src={ebook.imageCover?.url!}
          alt="eBook gratuito sull'introduzione alla sceneggiatura cinematografica"
          width={200}
          height={400}
          sizes="(max-width: 1280px) 90vw, 20vw"
          className="mx-auto w-4/5 group-hover:scale-[1.02] group-hover:shadow-lg duration-700"
          quality={90}
        />
      </Link>
    </div>
  );
};

export default SidebarEbook;
