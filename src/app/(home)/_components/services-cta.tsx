import Link from "next/link";
import { Button } from "@/shared/ui/button";

export const ServicesCta = () => (
  <section className="py-24 bg-foreground border-b border-b-accent">
    <div className="container mx-auto px-6 lg:max-w-6xl">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-bold mb-6 text-primary-foreground">
          Pronto per il prossimo passo?
        </h2>
        <div className="w-20 h-1 bg-primary mx-auto"></div>
        <p className="text-primary-foreground/70 mt-6 max-w-2xl mx-auto text-lg">
          Hai già una storia che aspetta un parere, oppure un&apos;idea da
          portare fino in fondo. Due strade, entrambe con il supporto di chi
          lavora sulle sceneggiature ogni giorno.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-card p-8 rounded-3xl border border-accent flex flex-col">
          <p className="uppercase text-xs font-black tracking-widest text-primary">
            Editing Double View
          </p>
          <h3 className="mt-3 text-2xl font-bold text-foreground">
            Il parere di due consulenti sulla tua storia
          </h3>
          <p className="mt-3 text-secondary-foreground">
            Due consulenti analizzano soggetto o sceneggiatura in modo
            indipendente e ti restituiscono un parere unico. Risposta in 7-10
            giorni lavorativi, prezzo sotto la media del mercato.
          </p>
          <div className="mt-auto pt-6">
            <Button asChild size="lg" className="w-full sm:w-auto">
              <Link href="/shop/servizi-di-editing" prefetch>
                Richiedi il parere sulla tua storia
              </Link>
            </Button>
          </div>
        </div>
        <div className="bg-card p-8 rounded-3xl border border-accent flex flex-col">
          <p className="uppercase text-xs font-black tracking-widest text-primary">
            Laboratori &amp; Corsi
          </p>
          <h3 className="mt-3 text-2xl font-bold text-foreground">
            Scrivi la tua storia, dal concept alla stesura
          </h3>
          <p className="mt-3 text-secondary-foreground">
            Un percorso guidato individuale o in un gruppo ristretto: esercitazioni,
            revisioni e confronto con gli altri sceneggiatori, dalla logline fino alla terza
            stesura del tuo soggetto.
          </p>
          <div className="mt-auto pt-6">
            <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
              <Link href="/shop/corsi-di-sceneggiatura" prefetch>
                Scopri i laboratori
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);