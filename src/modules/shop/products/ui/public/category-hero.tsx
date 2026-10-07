import type { ReactNode } from "react";

type PresetCategory = {
  slug: string;
  badge: string;
  emphasized: string;
  paragraph: ReactNode;
};

const PRESET_CATEGORIES: PresetCategory[] = [
  {
    slug: "servizi-di-editing",
    badge: 'Analisi professionale "Double View"',
    emphasized: "Servizi di Editing",
    paragraph: (
      <>
        Il nostro servizio di analisi non è una semplice lettura, ma un check-up
        completo eseguito da
        <span className="text-foreground font-bold">
          {" "}
          entrambi i nostri consulenti{" "}
        </span>
        per garantirti due punti di vista professionali complementari.
      </>
    ),
  },
  {
    slug: "corsi-di-sceneggiatura",
    badge: "Laboratori di sviluppo attivo",
    emphasized: "Corsi & Masterclass",
    paragraph: (
      <>
        Trasforma la tua intuizione in una struttura narrativa solida. I nostri
        percorsi mettono al centro il tuo progetto, affiancandoti nello
        <span className="text-foreground font-bold">
          {" "}
          sviluppo concreto della tua idea{" "}
        </span>
        fino alla stesura di un soggetto professionale pronto per il mercato.
      </>
    ),
  },
  {
    slug: "ebooks",
    badge: "Strumenti operativi pronti all'uso",
    emphasized: "Ebooks & Guide",
    paragraph: (
      <>
        Accedi a una libreria di manuali strategici e blueprint basati su
        <span className="text-foreground font-bold">
          {" "}
          standard internazionali{" "}
        </span>
        per risolvere problemi strutturali e potenziare ogni fase della tua
        creatività.
      </>
    ),
  },
];

const DEFAULT_PRESET: Omit<PresetCategory, "slug"> = {
  badge: 'Analisi Professionale "Double View"',
  emphasized: "Servizi di Editing",
  paragraph: (
    <>
      Il nostro servizio di analisi non è una semplice lettura, ma un check-up
      completo eseguito da
      <span className="text-foreground font-bold">
        {" "}
        entrambi i nostri consulenti{" "}
      </span>
      per garantirti due punti di vista professionali complementari.
    </>
  ),
};

export const CategoryHero = ({ categorySlug }: { categorySlug: string }) => {
  const preset = PRESET_CATEGORIES.find((p) => p.slug === categorySlug);

  const badgeText = preset?.badge ?? DEFAULT_PRESET.badge;
  const emphasizedText = preset?.emphasized ?? DEFAULT_PRESET.emphasized;
  const paragraph = preset?.paragraph ?? DEFAULT_PRESET.paragraph;

  return (
    <section className="pb-12 border-b border-b-accent">
      <div className="container mx-auto px-6 text-center">
        <div className="inline-block px-4 py-1.5 bg-primary/10 rounded-full text-primary text-xs font-bold uppercase tracking-widest mb-6">
          {badgeText}
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-foreground mb-8 leading-tight">
          I Nostri <span className="text-primary italic">{emphasizedText}</span>
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto leading-relaxed">
          {paragraph}
        </p>
      </div>
    </section>
  );
};
