"use client";

import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { LibraryBig, Newspaper } from "lucide-react";

const routes = [
  {
    title: "Home",
    link: "/",
  },
  {
    title: "About",
    link: "/about/",
  },
  {
    title: "Ebooks",
    link: "/ebooks/",
  },
  {
    title: "Blog",
    link: "/blog/",
  },
  {
    title: "Risorse",
    link: "/contatti/",
  },
];

interface NavProps {
  isMobile?: boolean;
  onLinkClick?: () => void;
}

export const Nav = ({ isMobile = false, onLinkClick }: NavProps) => {
  const pathname = usePathname();
  return (
    <NavigationMenu
      orientation={isMobile ? "vertical" : "horizontal"}
      className={cn(isMobile && "mx-auto")}
    >
      <NavigationMenuList
        className={cn(
          isMobile && "flex-col justify-center items-start space-x-0 gap-y-8"
        )}
      >
        {isMobile &&
          routes.map(
            (route): JSX.Element => (
              <NavigationMenuItem key={route.title}>
                <Link
                  key={route.title}
                  href={route.link}
                  prefetch={true}
                  className={cn(
                    "text-base py-2 px-4 rounded-md hover:bg-violet-100 text-foreground hover:text-primary-public",
                    isMobile && "text-2xl font-light tr",
                    pathname === route.link && "text-primary-public"
                  )}
                  onClick={() => {
                    if (isMobile && onLinkClick) onLinkClick();
                  }}
                >
                  {route.title}
                </Link>
              </NavigationMenuItem>
            )
          )}
        {!isMobile && (
          <>
            <NavigationMenuItem>
              <Link
                href="/"
                prefetch={true}
                className={cn(
                  "text-base py-2 px-4 rounded-md hover:bg-violet-100 text-foreground hover:text-primary-public",
                  isMobile && "text-2xl font-light tr",
                  pathname === "/" && "text-primary-public"
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
                href="/about/"
                prefetch={true}
                className={cn(
                  "text-base py-2 px-4 rounded-md hover:bg-violet-100 text-foreground hover:text-primary-public",
                  isMobile && "text-2xl font-light tr",
                  pathname === "/about/" && "text-primary-public"
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
                  "text-base py-2 rounded-md hover:bg-violet-100 text-foreground hover:text-primary-public",
                  isMobile && "text-2xl font-light tr",
                  (pathname === "/ebooks/" || pathname === "/blog/") &&
                    "text-primary-public"
                )}
              >
                Risorse
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  <li className="row-span-3">
                    <Link
                      className="flex h-full w-full relative select-none flex-col justify-end rounded-md bg-violet-100/40 hover:bg-violet-200 transition-all p-6 no-underline outline-none focus:shadow-md"
                      href="/ebooks/"
                    >
                      <LibraryBig
                        className="absolute h-8 w-8 bottom-4 right-4 text-primary "
                        strokeWidth={1}
                      />
                      <div className="my-2 text-lg font-medium">Ebooks</div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Esplora una selezione di ebook e risorse esclusive sulla
                        sceneggiatura cinematografica, ideali per scrittori e
                        appassionati del settore.
                      </p>
                    </Link>
                  </li>
                  <li className="row-span-3">
                    <Link
                      className="flex h-full w-full relative select-none flex-col justify-end rounded-md bg-violet-100/40 hover:bg-violet-200 transition-all p-6 no-underline outline-none focus:shadow-md"
                      href="/blog"
                    >
                      <Newspaper
                        className="absolute h-8 w-8 bottom-4 right-4 text-primary "
                        strokeWidth={1}
                      />
                      <div className="my-2 text-lg font-medium">Blog</div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Leggi articoli e approfondimenti sul mondo del cinema,
                        con focus sulla scrittura di sceneggiature e le tecniche
                        narrative utilizzate nei film.
                      </p>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link
                href="/contatti/"
                prefetch={true}
                className={cn(
                  "text-base py-2 px-4 rounded-md hover:bg-violet-100 text-foreground hover:text-primary-public",
                  isMobile && "text-2xl font-light tr",
                  pathname === "/contatti/" && "text-primary-public"
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
