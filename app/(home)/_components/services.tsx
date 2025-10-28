import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import React, { type JSX } from "react";

export const CreativeFeatures = (): JSX.Element => (
  <section className="px-4 py-20 lg:px-6 bg-primary-foreground">
    <div className="mx-auto max-w-lg md:max-w-(--breakpoint-md) lg:max-w-6xl">
      <h2 className="mb-4 text-center text-3xl font-bold">I nostri servizi</h2>
      <p className="mx-auto max-w-lg text-center ">
        Offriamo una vasta gamma di strumenti e risorse di qualità per
        supportare e arricchire la tua pratica della sceneggiatura
        cinematografica. Siamo qui per aiutarti a migliorare, crescere e
        raggiungere il massimo potenziale come sceneggiatore.
      </p>
      <div className="flex flex-col gap-y-20 lg:gap-y-4 ">
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div className="md:order-1 aspect-square relative">
            <Image
              src="/blog-services-pana.png"
              alt="Feature"
              fill
              sizes="(max-width: 1023px) 90vw, 35vw"
              className="object-cover"
            />
          </div>

          <div className="md:order-2">
            <p className="uppercase text-heading">Creative Features</p>
            <h3 className="mt-4 text-3xl font-bold">
              Contenuti settimanali di qualità nel nostro blog.
            </h3>
            <p className="mt-2">
              Ogni settimana, pubblichiamo contenuti approfonditi e informativi
              sul nostro blog, che coprono una vasta gamma di argomenti legati
              alla sceneggiatura cinematografica.
              <br />
              <br />
              Accedi alle nostre preziose risorse per acquisire nuove conoscenze
              e affinare le tue competenze nella scrittura per il cinema.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link href="/blog/sceneggiatura" prefetch>
                <Button className="bg-primary">Blog</Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 items-center gap-16 md:grid-cols-2">
          <div className="md:order-2 aspect-square relative">
            <Image
              src="/reading-pagina-uno.png"
              alt="Feature"
              fill
              sizes="(max-width: 1023px) 90vw, 35vw"
              className="object-cover"
            />
          </div>

          <div className="md:order-1">
            <p className="uppercase text-heading">Creative Features</p>
            <h3 className="mt-4 text-3xl font-bold">
              Sceneggiature di film famosi per l&apos;ispirazione e
              l&apos;apprendimento.
            </h3>
            <p className="mt-2">
              Offriamo accesso a esempi di sceneggiature di film famosi, che
              rappresentano una preziosa fonte di ispirazione e apprendimento
              per gli sceneggiatori.
              <br />
              <br />
              Studia il lavoro dei professionisti e apprendi le loro tecniche
              narrative per affinare la tua abilità di scrittura e creare storie
              coinvolgenti.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link href="/blog/pagina-uno" prefetch>
                <Button className="bg-primary">
                  Esempi di sceneggiature di film famosi
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
