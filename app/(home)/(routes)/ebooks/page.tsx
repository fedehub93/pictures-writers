import { Metadata } from "next";

import { getPublishedEbooks } from "@/lib/ebook";
import { getHeadMetadata } from "../../_components/seo/head-metadata";

import { Breadcrumbs } from "../../_components/breadcrumbs";
import { EbooksList } from "./_components/ebooks-list";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  return {
    ...metadata,
    title: "Ebooks: Pictures Writers",
    description:
      "Sei un aspirante sceneggiatore e hai delle domande a cui non trovi risopsta? Contattaci e ti risponderemo il prima possibile.",
  };
}

const EbooksPage = async () => {
  const { ebooks, totalPages, currentPage } = await getPublishedEbooks({
    page: 1,
  });

  return (
    <section className="bg-violet-100/40">
      <div className="bg-primary w-full">
        <div className="max-w-6xl mx-auto h-20 flex justify-center items-center">
          <h1 className="text-white font-extrabold text-4xl uppercase">
            Ebooks
          </h1>
        </div>
      </div>
      <div className="py-12">
        <div className="px-4 xl:px-0 lg:max-w-6xl mx-auto flex flex-col gap-y-4">
          <Breadcrumbs
            items={[{ title: "Home", href: "/" }, { title: "Ebooks" }]}
          />
          <p className="font-bold">
            Scopri la nostra collezione di ebook dedicati alla sceneggiatura
            cinematografica.
          </p>
          <p>
            Strumenti pratici, guide essenziali e approfondimenti per
            trasformare le tue idee in storie indimenticabili. Che tu sia un
            aspirante sceneggiatore o un professionista in cerca di ispirazione,
            qui troverai risorse pensate per il tuo percorso creativo.
          </p>
          <EbooksList
            ebooks={ebooks}
            totalPages={totalPages}
            currentPage={currentPage}
          />
        </div>
      </div>
    </section>
  );
};

export default EbooksPage;
