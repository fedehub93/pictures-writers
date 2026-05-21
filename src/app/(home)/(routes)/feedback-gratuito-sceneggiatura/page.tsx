import { Metadata } from "next";

import { db } from "@/lib/db";

import FirstImpressionForm from "./_components/first-impression-form";

import { getHeadMetadata } from "../../_components/seo/head-metadata";
import { getSettings } from "@/data/settings";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();
  const { siteUrl } = await getSettings();

  return {
    ...metadata,
    title: "Feedback gratuito sceneggiatura: Pictures Writers",
    description:
      "Sei alle prime armi? Richiedi subito il feedback gratuito sulla prima pagina della tua sceneggiatura.",
    alternates: {
      canonical: `${siteUrl}/feedback-gratuito-sceneggiatura/`,
    },
  };
}

const FirstImpression = async () => {
  const formats = await db.format.findMany({
    orderBy: { title: "asc" },
  });

  const genres = await db.genre.findMany({
    orderBy: { title: "asc" },
  });

  return (
    <section className="px-4 lg:px-6">
      <div className="mx-auto max-w-lg pb-20 pt-14 md:max-w-(--breakpoint-md) lg:max-w-5xl lg:text-left">
        <div className="flex flex-col px-4">
          <h1 className="mb-4 mr-auto text-2xl font-extrabold">
            Ottieni un feedback gratuito sulla prima pagina della tua
            sceneggiatura
          </h1>
        </div>
        <div className="mb-10 flex w-full flex-col items-center justify-center p-4 md:mb-0">
          <div className="mb-10 self-start">
            <p className="max-w-4xl text-sm leading-6">
              Breve nota gratuita sulla tua prima pagina: guarda cosa pensa una
              persona esperta della prima pagina della tua sceneggiatura.
              Riceverai mezza pagina di note entro cinque giorni -{" "}
              <span className="font-bold text-heading">100% gratis!</span>
            </p>
          </div>
          <FirstImpressionForm formats={formats} genres={genres} />
        </div>
      </div>
    </section>
  );
};

export default FirstImpression;
