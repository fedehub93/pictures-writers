"use client";

import { JSX } from "react";
import Image from "next/image";

import Link from "next/link";

import { Button } from "@/components/ui/button";

export const HeroSection = (): JSX.Element => {
  return (
    <section className="w-full bg-violet-100/40 px-4 lg:px-6 py-24">
      <div className="mx-auto max-w-lg text-center md:max-w-screen-md lg:max-w-6xl lg:text-left">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-y-10">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl xl:text-6xl">
              Vuoi diventare <br />
              <span className="text-primary-public">uno sceneggiatore?</span>
            </h1>
            <p>
              <span className="mt-2 rounded-md bg-violet-100 p-1 font-bold text-primary-public">
                La nostra missione è alimentare la tua fiamma creativa
              </span>
              , fornendoti l&apos;ispirazione, l&apos;istruzione e la comunità
              di supporto di cui hai bisogno per diventare uno sceneggiatore di
              successo.
            </p>
            <p>
              Pronto a dare vita alle tue idee sul grande schermo?
              <br />
              <span className="font-bold text-primary-public">
                Scarica il nostro eBook gratuito:
              </span>
              &nbsp;
              <span className="font-bold italic text-black">
                Introduzione alla sceneggiatura cinematografica
              </span>
              , e inizia a scrivere le tue storie di successo.
            </p>
            <div>
              <Button asChild type="button">
                <Link href="/shop/ebooks/introduzione-alla-sceneggiatura">
                  Vai all&apos;Ebook
                </Link>
              </Button>
            </div>
          </div>
          <div className="mb-12 rounded-lg lg:mb-0 aspect-square relative">
            <Image
              alt="jumbotron"
              fill
              className="object-cover"
              sizes="(max-width: 1023px) 90vw, 35vw"
              src="/story-book.png"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};
