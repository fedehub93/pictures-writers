"use client";

import type { JSX, ReactNode } from "react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileTextIcon,
  LibraryBigIcon,
  NewspaperIcon,
  SchoolIcon,
  TrophyIcon,
  VideoIcon,
} from "lucide-react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const routes: { title: string; link: Route }[] = [
  {
    title: "Home",
    link: "/",
  },
  {
    title: "About",
    link: "/about/" as Route,
  },
  {
    title: "Formazione",
    link: "/blog/scuole-di-sceneggiatura" as Route,
  },
  {
    title: "Concorsi",
    link: "/blog/concorsi-di-sceneggiatura/" as Route,
  },
  { title: "Servizi", link: "/shop/" as Route },
  {
    title: "Ebooks",
    link: "/shop/ebooks/" as Route,
  },
  {
    title: "Blog",
    link: "/blog/" as Route,
  },
  {
    title: "Contatti",
    link: "/contatti/" as Route,
  },
];

const resources: {
  title: string;
  description: string;
  href: string;
  Icon: ReactNode;
}[] = [
  {
    title: "Formazione",
    description:
      "Esplora scuole, corsi e percorsi formativi dedicati alla scrittura per il cinema per orientarti nel mondo della sceneggiatura.",
    href: "/blog/scuole-di-sceneggiatura/",
    Icon: (
      <SchoolIcon
        className="absolute h-8 w-8 bottom-4 right-2 text-primary"
        strokeWidth={1}
      />
    ),
  },
  {
    title: "Concorsi",
    description:
      "Scopri bandi attivi, consigli per partecipare e storie di chi ce l'ha fatta nei concorsi di sceneggiatura in Italia.",
    href: "/blog/concorsi-di-sceneggiatura/",
    Icon: (
      <TrophyIcon
        className="absolute h-8 w-8 bottom-4 right-2 text-primary"
        strokeWidth={1}
      />
    ),
  },
  {
    title: "Ebooks & Guide",
    description:
      "Esplora una selezione di ebook e risorse esclusive sulla sceneggiatura cinematografica, ideali per scrittori e appassionati del settore.",
    href: "/shop/ebooks/",
    Icon: (
      <LibraryBigIcon
        className="absolute h-8 w-8 bottom-4 right-2 text-primary"
        strokeWidth={1}
      />
    ),
  },
  {
    title: "Blog",
    description:
      "Leggi articoli e approfondimenti sul mondo del cinema, con focus sulla scrittura di sceneggiature e le tecniche narrative utilizzate.",
    href: "/blog/",
    Icon: (
      <NewspaperIcon
        className="absolute h-8 w-8 bottom-4 right-2 text-primary"
        strokeWidth={1}
      />
    ),
  },
];

const services: {
  title: string;
  description: string;
  href: string;
  Icon: ReactNode;
}[] = [
  {
    title: "Servizi di Editing",
    description: "Ottieni una valutazione tecnica profonda del tuo progetto.",
    href: "/shop/servizi-di-editing/" as Route,
    Icon: (
      <FileTextIcon
        className="absolute h-8 w-8 bottom-4 right-2 text-primary"
        strokeWidth={1}
      />
    ),
  },
  {
    title: "Corsi & Masterclass",
    description:
      "Percorsi formativi strutturati per una crescita professionale accelerata.",
    href: "/shop/corsi-di-sceneggiatura/" as Route,
    Icon: (
      <VideoIcon
        className="absolute h-8 w-8 bottom-4 right-2 text-primary"
        strokeWidth={1}
      />
    ),
  },
];

interface SubMenuItemProps {
  pathname: string;
  title: string;
  description: string;
  href: string;
  Icon: ReactNode;
}

const SubMenuItem = ({
  pathname,
  title,
  description,
  href,
  Icon,
}: SubMenuItemProps) => {
  return (
    <li
      className={cn(
        "row-span-3",
        pathname === href && "bg-accent rounded-md shadow-md",
      )}
    >
      <Link
        className="flex h-full w-full relative select-none flex-col justify-end rounded-md transition-all p-6 no-underline outline-hidden focus:bg-accent focus:shadow-md"
        href={href as Route}
      >
        {Icon}
        <div className="my-2 text-lg font-medium">{title}</div>
        <p className="text-sm leading-tight text-muted-foreground">
          {description}
        </p>
      </Link>
    </li>
  );
};

interface NavProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export const Nav = ({ isMobile = false, onLinkClick }: NavProps) => {
  const pathname = usePathname();
  return (
    <NavigationMenu
      orientation={isMobile ? "vertical" : "horizontal"}
      className={cn(isMobile && "mx-auto max-w-full w-full")}
    >
      <NavigationMenuList
        className={cn(
          isMobile && "flex-col justify-center items-start space-x-0 gap-y-8",
        )}
      >
        {isMobile &&
          routes.map(
            (route): JSX.Element => (
              <NavigationMenuItem key={route.title}>
                <Link
                  key={route.title}
                  href={route.link}
                  prefetch
                  className={cn(
                    "text-base py-2 px-4 rounded-md text-foreground hover:text-primary",
                    isMobile && "text-2xl font-light tr",
                    pathname === route.link && "text-primary",
                  )}
                  onClick={() => {
                    if (isMobile && onLinkClick) onLinkClick();
                  }}
                >
                  {route.title}
                </Link>
              </NavigationMenuItem>
            ),
          )}
        {!isMobile && (
          <>
            <NavigationMenuItem>
              <Link
                href="/"
                prefetch
                className={cn(
                  "text-base py-2 px-4 rounded-md hover:text-primary text-foreground",
                  isMobile && "text-2xl font-light tr",
                  pathname === "/" && "text-primary",
                )}
                onClick={() => {
                  if (isMobile && onLinkClick) onLinkClick();
                }}
              >
                Home
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="/about"
                prefetch
                className={cn(
                  "text-base py-2 px-4 rounded-md hover:text-primary text-foreground",
                  isMobile && "text-2xl font-light tr",
                  pathname === "/about/" && "text-primary",
                )}
                onClick={() => {
                  if (isMobile && onLinkClick) onLinkClick();
                }}
              >
                About
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  "text-base py-2 rounded-md text-foreground hover:text-primary bg-transparent",
                  isMobile && "text-2xl font-light tr",
                  pathname.startsWith("/shop/") &&
                    !pathname.endsWith("/ebooks/") &&
                    "text-primary",
                )}
              >
                Servizi
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-100 gap-3 p-4 md:w-125 md:grid-cols-2 lg:w-150 ">
                  {services.map((s) => (
                    <SubMenuItem key={s.title} pathname={pathname} {...s} />
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger
                className={cn(
                  "text-base py-2 rounded-md text-foreground hover:text-primary bg-transparent",
                  isMobile && "text-2xl font-light tr",
                  (pathname.startsWith("/shop/ebooks") ||
                    pathname.startsWith("/blog/")) &&
                    "text-primary",
                )}
              >
                Risorse
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-100 gap-3 p-4 md:w-125 md:grid-cols-2 lg:w-150 ">
                  {resources.map((r) => (
                    <SubMenuItem key={r.title} pathname={pathname} {...r} />
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="/contatti"
                prefetch
                className={cn(
                  "text-base py-2 px-4 rounded-md text-foreground hover:text-primary",
                  isMobile && "text-2xl font-light tr",
                  pathname === "/contatti/" && "text-primary",
                )}
                onClick={() => {
                  if (isMobile && onLinkClick) onLinkClick();
                }}
              >
                Contatti
              </Link>
            </NavigationMenuItem>
          </>
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
