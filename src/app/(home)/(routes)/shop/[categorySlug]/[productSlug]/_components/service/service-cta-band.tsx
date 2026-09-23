"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  ArrowRightIcon,
  ClockIcon,
  MessageCircleIcon,
  UsersIcon,
} from "lucide-react";
import { sendGTMEvent } from "@next/third-parties/google";

import { Button } from "@/shared/ui/button";

interface ServiceCtaBandProps {
  price?: number | null;
  variant?: "mid" | "final";
}

export const ServiceCtaBand = ({
  price,
  variant = "final",
}: ServiceCtaBandProps) => {
  const ctaId = variant === "mid" ? "service_mid_cta" : "service_final_cta";

  const onCtaClick = () => {
    sendGTMEvent({
      event: "cta_click",
      cta_id: ctaId,
      cta_label: "Richiedi la tua analisi",
      page_path: window.location.pathname,
    });
  };

  return (
    <section className="py-12">
      <div className="mx-auto lg:max-w-6xl">
        <div className="bg-foreground rounded-[2.5rem] p-10 md:p-14 text-center text-primary-foreground shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto? Richiedi la tua analisi
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-2xl mx-auto">
            {variant === "mid"
              ? "Soggetto, struttura, personaggi, dialoghi: ora sai esattamente cosa viene analizzato. Metti alla prova il tuo copione."
              : "Hai letto tutto: report Double View, i tempi, i punti di forza e le criticità della tua storia. Il prossimo passo è il tuo."}
          </p>
          {variant === "final" && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-10">
              <div className="flex items-center gap-3">
                <UsersIcon size={20} className="text-primary" />
                <span className="text-sm text-primary-foreground/80">
                  Analisi di 2 consulenti
                </span>
              </div>
              <div className="flex items-center gap-3">
                <ClockIcon size={20} className="text-primary" />
                <span className="text-sm text-primary-foreground/80">
                  Consegna in 7-10 giorni
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MessageCircleIcon size={20} className="text-primary" />
                <span className="text-sm text-primary-foreground/80">
                  Supporto post-consegna
                </span>
              </div>
            </div>
          )}
          <Button
            asChild
            type="button"
            size="lg"
            onClick={onCtaClick}
            className="font-bold"
          >
            <Link href={`submission` as Route}>
              Richiedi la tua analisi
              <ArrowRightIcon size={20} />
            </Link>
          </Button>
          {price ? (
            <p className="mt-6 text-sm text-primary-foreground/60">
              Analisi &ldquo;Double View&rdquo; — €{price} IVA incl.
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
};