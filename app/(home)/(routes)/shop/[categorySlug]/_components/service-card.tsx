"use client";

import { Button } from "@/components/ui/button";
import { CheckIcon } from "lucide-react";
import Link from "next/link";

interface ServiceCardProps {
  title: string;
  categorySlug: string;
  slug: string;
  serviceType: string;
  target: string;
  competitorPrice: number;
  features: { title: string; Icon: string; description: string }[];
  price: number | null;
}

export const ServiceCard = ({
  title,
  categorySlug,
  slug,
  serviceType,
  target,
  competitorPrice,
  features,
  price,
}: ServiceCardProps) => {
  const href = `/shop/${categorySlug}/${slug}` as const;
  return (
    <div
      key={title}
      className="group bg-card border border-accent rounded-3xl p-8 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/30 transition-all duration-300 flex flex-col"
    >
      <div className="mb-6">
        <span
          className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
            serviceType === "Soggetto"
              ? "bg-blue-50 text-blue-600"
              : serviceType === "Sceneggiatura"
                ? "bg-orange-50 text-orange-600"
                : "bg-purple-50 text-purple-600"
          }`}
        >
          {serviceType}
        </span>
        <h3 className="text-3xl font-bold text-foreground mt-4 mb-3 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground italic leading-relaxed line-clamp-2">
          <span className="font-bold text-accent-foreground not-italic">
            Ideale per:
          </span>{" "}
          {target}
        </p>
      </div>

      <div className="mb-8 p-5 bg-muted rounded-2xl border border-primary/5">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-3xl font-black text-foreground">€{price}</span>
        </div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          Prezzo Competitor:{" "}
          <span className="line-through decoration-primary/50">
            €{competitorPrice}
          </span>
        </p>
      </div>

      <div className="grow mb-8">
        <p className="text-xs font-bold text-foreground uppercase tracking-widest mb-4">
          Riceverai:
        </p>
        <ul className="space-y-3">
          {features.slice(0, 3).map((f, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-sm text-secondary-foreground"
            >
              <CheckIcon className="size-6 text-primary" />
              <span className="line-clamp-2">{f.description}</span>
            </li>
          ))}
          {features.length > 3 && (
            <li className="text-xs text-primary font-bold ml-8">
              + altro ancora...
            </li>
          )}
        </ul>
      </div>

      <Button
        asChild
        type="button"
        className="bg-foreground hover:bg-primary font-bold transition-colors shadow-lg"
      >
        <Link href={href}>Vedi Dettagli</Link>
      </Button>
    </div>
  );
};
