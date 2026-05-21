import { Metadata } from "next";
import Link from "next/link";

import { getHeadMetadata } from "./_components/seo/head-metadata";

import type { JSX } from "react";

export async function generateMetadata(): Promise<Metadata | null> {
  const metadata = await getHeadMetadata();

  return {
    ...metadata,
    title: "404: Pictures Writers",
    description: "Pagina 404 di Pictures Writers",
  };
}

const NotFound = (): JSX.Element => (
  <section className="w-full items-center">
    <div className="flex h-full w-full flex-col items-center justify-center gap-y-8 px-5 py-24 text-center">
      <h2 className="text-9xl font-extrabold text-gray-300">404</h2>
      <h3 className="text-5xl font-extrabold uppercase text-heading">
        Pagina non trovata
      </h3>
      <p>
        Oops, sembrerebbe che la pagina sia andata perduta.
        <br /> Non è un errore ma solo un incidente non intenzionale.
      </p>
      <Link href="/" className="bg-secondary text-primary!">
        Torna alla home
      </Link>
    </div>
  </section>
);

export default NotFound;
