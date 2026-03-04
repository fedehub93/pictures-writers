"use client";
import type { Route } from "next";
import Link from "next/link";

import {
  ArrowRightIcon,
  BookOpenIcon,
  FileTextIcon,
  VideoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const categories = [
  {
    id: "Service",
    name: "Servizi di editing",
    slug: "/shop/servizi-di-editing/",
    description:
      "Ottieni una valutazione tecnica profonda del tuo progetto. Ideale per chi vuole scoprire i punti di forza e le criticità della propria sceneggiatura prima di presentarla a produttori o concorsi.",
    icon: <FileTextIcon size={28} />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-100",
    hoverBorder: "hover:border-blue-300",
  },
  {
    id: "Course",
    name: "Corsi & Masterclass",
    slug: "/shop/corsi-di-sceneggiatura/",
    description:
      "Percorsi formativi strutturati per una crescita professionale accelerata. Impara dai migliori consulenti con lezioni mirate sulla struttura, i personaggi e il mercato.",
    icon: <VideoIcon size={28} />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-100",
    hoverBorder: "hover:border-purple-300",
  },
  {
    id: "Ebook",
    name: "Ebook & Guide",
    slug: "/shop/ebooks/",
    description:
      "Manuali pratici e guide rapide per affinare la tua tecnica. Perfetti per uno studio autonomo e costante, con consigli applicabili immediatamente ai tuoi testi.",
    icon: <BookOpenIcon size={28} />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-100",
    hoverBorder: "hover:border-orange-300",
  },
];

interface CategoryListProps {}

export const CategoryList = ({}: CategoryListProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className={`group relative p-10 bg-card border ${cat.borderColor} ${cat.hoverBorder} rounded-[2.5rem] transition-all duration-500 hover:shadow-xl hover:shadow-gray-100 flex flex-col h-full`}
        >
          <div
            className={`w-16 h-16 ${cat.bgColor} ${cat.color} rounded-2xl flex items-center justify-center mb-8 transform group-hover:scale-110 transition-transform duration-500`}
          >
            {cat.icon}
          </div>

          <h3 className="text-2xl font-black text-foreground mb-4 leading-tight group-hover:text-primary transition-colors">
            {cat.name}
          </h3>

          <p className="text-muted-foreground text-sm leading-relaxed mb-8 grow">
            {cat.description}
          </p>

          <Button asChild className="bg-foreground">
            <Link
              href={cat.slug as Route}
              className={`flex items-center gap-3`}
            >
              <span className="font-bold">Vedi dettagli</span>
              <ArrowRightIcon className="size-4 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
};
