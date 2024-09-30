import { Metadata } from "next";
import Link from "next/link";

import { getHeadMetadata } from "../../_components/seo/head-metadata";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  return {
    ...metadata,
    title: "Policy: Pictures Writers",
    description: "Policy di Pictures Writers",
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}

const Policy = (): JSX.Element => (
  <section className="px-4 py-20 lg:px-6">
    <div className="mx-auto  flex max-w-6xl flex-col items-center">
      <div className="flex h-full w-full flex-col items-start gap-y-8 py-12">
        <h1 className="text-5xl font-extrabold text-gray-300">Policy</h1>
        <h2 className="text-3xl font-extrabold uppercase text-heading">
          Disclaimer Amazon
        </h2>
        <p className="leading-7">
          {`Pictures Writers (pictureswriters.com) partecipa al Programma
          Affiliazione Amazon EU, che consente di percepire commissioni
          pubblicitarie sponsorizzando e fornendo link al sito Amazon.it.`}
          <br />
          {`Tuttavia l’affiliazione con Amazon non aumenta il prezzo del
          prodotto, ma ci permette di migliorare giorno dopo giorno i contenuti
          e la qualità del sito.`}
          <br />
          {`I prezzi e la disponibilità non sono vengono aggiornati in
          tempo reale, possono quindi subire variazioni. Vi consigliamo di
          verificare sempre la disponibilità e il prezzo su Amazon.`}
        </p>
        <Link className="bg-secondary !text-primary" href="/">
          Torna alla home
        </Link>
      </div>
    </div>
  </section>
);

export default Policy;
