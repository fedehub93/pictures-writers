"use client";
import "client-only";

import { useState } from "react";
import { MenuIcon } from "lucide-react";

import { InlineSmartLink } from "@/puck/fields/link/ui/inline-link";
import { getLinkHref } from "@/puck/fields/link/types";
import { cn } from "@/shared/lib/utils";
import { Button, buttonVariants } from "@/shared/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

import { getNavLabel, isNavLinkActive } from "../lib/menu";
import type { NavItemUi } from "../types";
import { NavbarCard } from "./navbar-card";
import { NavLinkList } from "./nav-link-list";

const MOBILE_LINK_CLASSES =
  "block rounded-md px-3 py-2 text-base transition-colors hover:bg-accent hover:text-accent-foreground";

/**
 * Sheet content: plain links and CTAs are rows, columns become accordions and
 * cards reuse the rich card from the desktop mega menu.
 */
export const NavbarMobileList = ({
  items = [],
  pathname,
  onNavigate,
}: {
  items?: NavItemUi[];
  pathname?: string | null;
  onNavigate?: () => void;
}) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Mobile navigation" className="flex flex-col gap-1 px-4">
      <ul className="flex flex-col gap-1">
        {items.map((item, index) => {
          const key = `${item.type}-${item.label}-${index}`;

          if (item.type === "column") {
            return (
              <li key={key}>
                <Accordion type="single" collapsible>
                  <AccordionItem value={key} className="border-0">
                    <AccordionTrigger className="px-3 py-2 text-base hover:no-underline">
                      {item.label}
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      <NavLinkList
                        links={item.items ?? []}
                        pathname={pathname}
                        onNavigate={onNavigate}
                        className="pl-2"
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </li>
            );
          }

          if (item.type === "card") {
            return (
              <li key={key}>
                <NavbarCard
                  label={item.label}
                  description={item.description}
                  imageUrl={item.imageUrl}
                  link={item.link}
                  pathname={pathname}
                  onNavigate={onNavigate}
                  className="mt-1"
                />
              </li>
            );
          }

          if (item.type === "cta") {
            return (
              <li key={key} className="mt-1">
                <InlineSmartLink
                  link={item.link}
                  onClick={onNavigate}
                  className={cn(
                    buttonVariants({
                      variant:
                        item.variant === "secondary" ? "secondary" : "default",
                      size: "lg",
                    }),
                    "w-full font-semibold",
                  )}
                >
                  {getNavLabel(item.label, item.link)}
                </InlineSmartLink>
              </li>
            );
          }

          const active = isNavLinkActive(pathname, getLinkHref(item.link));

          return (
            <li key={key}>
              <InlineSmartLink
                link={item.link}
                onClick={onNavigate}
                className={cn(
                  MOBILE_LINK_CLASSES,
                  active && "bg-accent text-accent-foreground",
                )}
              >
                {getNavLabel(item.label, item.link)}
              </InlineSmartLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export const NavbarMobileMenu = ({
  items = [],
  pathname,
}: {
  items?: NavItemUi[];
  pathname?: string | null;
}) => {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          aria-label="Open menu"
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="overflow-y-auto px-0 py-6">
        <SheetHeader>
          <SheetTitle className="text-2xl font-light">Menu</SheetTitle>
        </SheetHeader>
        <NavbarMobileList
          items={items}
          pathname={pathname}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};
