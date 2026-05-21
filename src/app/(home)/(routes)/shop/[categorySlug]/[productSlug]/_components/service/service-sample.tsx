import { Button } from "@/components/ui/button";
import { DownloadIcon, EyeIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ServiceSampleProps {
  attachamentUrl: string;
}

export const ServiceSample = ({ attachamentUrl }: ServiceSampleProps) => {
  return (
    <section className="py-12">
      <div className="container mx-auto px-6 lg:max-w-6xl">
        <div className="flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1 order-2 lg:order-1">
            <h2 className="text-4xl text-foreground mb-8 leading-tight">
              Guarda un esempio <br />
              di Report Professionale
            </h2>
            <p className="text-secondary-foreground text-lg mb-10 leading-relaxed">
              Vogliamo che tu sappia esattamente cosa aspettarti. Il nostro
              report è un documento tecnico di alto livello, formattato secondo
              gli standard dell'industria cinematografica internazionale.
              <br />
              <br />
              Non sono semplici "commenti", ma una vera e propria{" "}
              <strong className="text-primary">mappa per la riscrittura</strong>
              . Clicca sul documento per sfogliare un'analisi fac-simile.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                asChild
                type="button"
                size="lg"
                className="bg-foreground flex items-center justify-center gap-3 font-bold transition-all"
              >
                <Link
                  href="/scheda-di-valutazione-fac-simile.pdf"
                  target="_blank"
                >
                  <DownloadIcon size={20} />
                  Scarica PDF
                </Link>
              </Button>
            </div>
          </div>

          <Link
            href="/scheda-di-valutazione-fac-simile.pdf"
            target="blank"
            className="flex-1 order-1 lg:order-2 flex justify-center lg:justify-end"
          >
            <div className="relative group cursor-zoom-in">
              {/* Document Mockup */}
              <div className="relative bg-white w-[320px] md:w-105 aspect-[1/1.41] shadow-[0_50px_100px_rgba(0,0,0,0.12)] rounded-sm border border-gray-100 p-10 md:p-14 transform group-hover:-rotate-2 group-hover:scale-[1.03] transition-all duration-700 overflow-hidden">
                {/* Facsimile peek */}
                <div className="text-[6px] md:text-[8px] text-gray-300 font-serif leading-tight">
                  <Image
                    src="/scheda-di-valutazione-fac-simile.jpg"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1023px) 90vw, 35vw"
                    alt="scheda di valutazione"
                  />
                </div>

                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-foreground/10 backdrop-blur-[2px]">
                  <span className="bg-white px-5 py-3 rounded-full shadow-2xl text-[10px] font-black uppercase tracking-widest text-secondary-foreground flex items-center gap-2">
                    <EyeIcon className="size-4 text-primary" />
                    Scarica Fac-Simile PDF
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};
