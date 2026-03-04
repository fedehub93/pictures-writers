"use client";

import { JSX } from "react";
import Image from "next/image";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export const HeroSection = (): JSX.Element => {
  return (
    <section className="w-full bg-background border-b border-b-accent px-4 lg:px-6 py-16 lg:py-8 lg:h-[calc(100vh-80px)] flex items-center">
      <div className="mx-auto max-w-lg text-center md:max-w-(--breakpoint-md) lg:max-w-6xl lg:text-left">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-y-10">
            <h1 className="text-4xl font-bold md:text-5xl xl:text-6xl">
              Vuoi diventare <br />
              <span className="text-primary">uno sceneggiatore?</span>
            </h1>
            <p>
              <span className="mt-2 rounded-md bg-accent p-1 font-bold">
                La nostra missione è alimentare la tua fiamma creativa
              </span>
              , fornendoti l&apos;ispirazione, l&apos;istruzione e la comunità
              di supporto di cui hai bisogno per diventare uno sceneggiatore di
              successo.
              <br />
              <br />
              Dai{" "}
              <span className="rounded-md bg-accent p-1 font-bold">
                laboratori di scrittura
              </span>{" "}
              alle{" "}
              <span className="rounded-md bg-accent p-1 font-bold">
                consulenze editoriali
              </span>{" "}
              d'élite: ti accompagniamo dalla prima pagina al pitch finale.
            </p>
            {/* <p>
              Pronto a dare vita alle tue idee sul grande schermo?
              <br />
              <span className="font-bold text-primary">
                Scarica il nostro eBook gratuito:
              </span>
              &nbsp;
              <span className="font-bold italic">
                Introduzione alla sceneggiatura cinematografica
              </span>
              , e inizia a scrivere le tue storie di successo.
            </p> */}

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Button asChild type="button" className="bg-foreground text-md" size="lg">
                <Link href="/shop/servizi-editoriali">Servizi Editoriali</Link>
              </Button>
              <Button asChild type="button" className="bg-foreground text-md" size="lg">
                <Link href="/shop/corsi-di-sceneggiatura">
                  Corsi & Masterclass
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-lg aspect-square relative">
            <Image
              alt="jumbotron"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 90vw, 35vw"
              src="/hero-section-pana.png"
              priority
            />
            {/* <div className="absolute top-1/4 -left-4 md:left-4 animate-float">
              <div className="bg-white p-5 rounded-2xl shadow-lg border border-primary/10 max-w-70">
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded-md uppercase">
                    Expiring
                  </span>
                  <span className="text-primary font-bold text-xs">
                    Mancano 48h
                  </span>
                </div>
                <h4 className="font-bold text-foreground mb-1">
                  Scrittura Dialoghi Avanzata
                </h4>
                <p className="text-xs text-gray-500 mb-4 italic">
                  Ultimi 5 posti disponibili con sconto "Early Bird".
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-foreground">
                    €129{" "}
                    <span className="text-xs text-gray-400 line-through">
                      €189
                    </span>
                  </span>
                  <button className="bg-foreground text-white text-[11px] font-bold px-3 py-2 rounded-lg hover:bg-primary transition-colors">
                    Iscriviti ora
                  </button>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </section>
  );
};
