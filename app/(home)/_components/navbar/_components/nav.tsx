"use client";

import Link from "next/link";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

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
        {routes.map(
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
      </NavigationMenuList>
    </NavigationMenu>
  );
};
