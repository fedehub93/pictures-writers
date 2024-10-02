"use client";

import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const routes = [
  {
    title: "Home",
    link: "/",
  },
  {
    title: "About",
    link: "/about",
  },
  {
    title: "Blog",
    link: "/blog",
  },
  {
    title: "Contatti",
    link: "/contatti",
  },
];

interface NavProps {
  isMobile?: boolean;
}

export const Nav = ({ isMobile = false }: NavProps) => {
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
        {routes.map(
          (route): JSX.Element => (
            <NavigationMenuItem key={route.title}>
              <Link
                key={route.title}
                href={route.link}
                legacyBehavior
                passHref
                prefetch={true}
              >
                <NavigationMenuLink
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "text-base hover:bg-background text-foreground hover:text-primary-public",
                    isMobile && "text-3xl font-light tr"
                  )}
                >
                  {route.title}
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          )
        )}
      </NavigationMenuList>
    </NavigationMenu>
  );
};
