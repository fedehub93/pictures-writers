import type { Route } from "next";
import Link from "next/link";

import {
  ArrowRightIcon,
  ClockIcon,
  MessageCircleIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";

interface ServiceInfoProps {
  serviceType: string;
  title: string;
  target: string;
  competitorPrice: number;
  price: number;
}

export const ServiceInfo = ({
  title,
  serviceType,
  target,
  competitorPrice,
  price,
}: ServiceInfoProps) => {
  return (
    <section className="py-4 overflow-hidden relative">
      <div className="mx-auto lg:max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-widest mb-8">
              <ShieldCheckIcon size={14} />
              {serviceType} - Analisi "Double View"
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-8">{title}</h1>
            <p className="text-xl text-secondary-foreground mb-10 leading-relaxed italic border-l-4 border-primary/30 pl-8 py-2">
              "{target}"
            </p>

            <div className="flex flex-wrap gap-4 mt-12">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-accent flex-1 min-w-50">
                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3">
                  Il Nostro Prezzo
                </h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-primary">
                    €{price}
                  </span>
                  <span className="text-sm text-muted-foreground font-bold">
                    IVA incl.
                  </span>
                </div>
              </div>
              <div className="bg-card-foreground p-6 rounded-3xl shadow-sm border border-accent flex-1 min-w-50">
                <h4 className="text-[10px] font-black text-primary-foreground uppercase tracking-widest mb-3">
                  Media Mercato
                </h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-primary-foreground line-through">
                    €{competitorPrice}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-105 shrink-0">
            <div className="bg-card-foreground p-10 rounded-[2.5rem] text-primary-foreground shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl z-0 group-hover:bg-primary/30 transition-colors"></div>
              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-8">Pronto a iniziare?</h3>
                <div className="space-y-6 mb-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-foreground/50 flex items-center justify-center shrink-0">
                      <UsersIcon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm">
                        Analisi di 2 consulenti
                      </h5>
                      <p className="text-xs text-gray-400 mt-1">
                        Due visioni professionali indipendenti.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-foreground/50 flex items-center justify-center shrink-0">
                      <ClockIcon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm">
                        Consegna in 7-10 giorni
                      </h5>
                      <p className="text-xs text-gray-400 mt-1">
                        Tempi certi e professionali.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-foreground/50 flex items-center justify-center shrink-0">
                      <MessageCircleIcon size={20} className="text-primary" />
                    </div>
                    <div>
                      <h5 className="font-bold text-sm">
                        Supporto post-consegna
                      </h5>
                      <p className="text-xs text-gray-400 mt-1">
                        Siamo qui per chiarire ogni dubbio.
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  asChild
                  type="button"
                  size="lg"
                  className="text-md hover:bg-primary-foreground hover:text-primary font-bold tracking-wide transition-all flex items-center justify-center gap-3"
                >
                  <Link href={`submission` as Route}>
                    Contattaci
                    <ArrowRightIcon
                      size={20}
                      className="group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </Button>
                <p className="text-center text-[10px] text-muted-foreground mt-6 uppercase tracking-widest font-bold">
                  Pagamento sicuro al 100%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
