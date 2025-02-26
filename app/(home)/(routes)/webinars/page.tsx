import { Metadata } from "next";

import { getPublishedEbooks } from "@/data/ebook";

import { getHeadMetadata } from "@/app/(home)/_components/seo/head-metadata";
import { Breadcrumbs } from "@/app/(home)/_components/breadcrumbs";
import { WebinarsList } from "./_components/webinars-list";
import { getPublishedWebinars } from "@/data/webinars";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  return {
    ...metadata,
    title: "Webinars: Pictures Writers",
    description:
      "Impara il mestiere dello sceneggiatore attraverso la nostra selezione di ebooks. Scopri di più.",
  };
}

const Page = async () => {
  const { webinars, totalPages, currentPage } = await getPublishedWebinars({
    page: 1,
  });

  return (
    <section className="bg-violet-100/40">
      <div className="bg-primary w-full">
        <div className="max-w-6xl mx-auto h-20 flex justify-center items-center">
          <h1 className="text-white font-extrabold text-4xl uppercase">
            Webinars
          </h1>
        </div>
      </div>
      <div className="py-12">
        <div className="px-4 xl:px-0 lg:max-w-6xl mx-auto flex flex-col gap-y-4">
          <Breadcrumbs
            items={[{ title: "Home", href: "/" }, { title: "Webinars" }]}
          />
          <p className="font-bold">
            Scopri i nuovi webinars in programma dedicata alla scrittura
            cinematografica.
          </p>
          <p>
            Dialoghi, personaggi e approfondimenti di ogni tipo per aiutarti a
            rendere la tua storia migliore. Che tu sia un aspirante
            sceneggiatore o un professionista in cerca di ispirazione, qui
            troverai webinar pensati per portare le tue conoscenze ad uno step
            successivo.
          </p>
          <WebinarsList
            webinars={webinars}
            totalPages={totalPages}
            currentPage={currentPage}
          />
        </div>
      </div>
    </section>
  );
};

export default Page;
