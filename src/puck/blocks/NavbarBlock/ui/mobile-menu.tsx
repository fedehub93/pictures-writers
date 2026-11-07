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

import {
  getNavLabel,
  hasMegaPanelContent,
  isNavLinkActive,
} from "../lib/menu";
import type { NavItemUi, NavbarCollapse } from "../types";
import { NavbarCard } from "./navbar-card";
import { NavbarMobileColumnList, NavLinkList } from "./nav-link-list";

/**
 * The hamburger exists only below the bucket chosen in the Navigation section.
 * The two literals stay in source so Tailwind emits both.
 */
const MOBILE_TRIGGER_VISIBILITY: Record<NavbarCollapse, string> = {
  mobile: "shrink-0 md:hidden",
  tablet: "shrink-0 lg:hidden",
};

const MOBILE_LINK_CLASSES =
  "puck-nav-label block rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground";

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
      <ul className="puck-nav-sheet-list flex flex-col">
        {items.map((item, index) => {
          const key = `${item.type}-${item.label}-${index}`;

          if (item.type === "column") {
            const children = item.items ?? [];
            const showsMegaPanelContent = children.some(hasMegaPanelContent);

            return (
              <li key={key}>
                <Accordion type="single" collapsible>
                  <AccordionItem value={key} className="border-0">
                    <AccordionTrigger className="puck-nav-label px-3 py-2 hover:no-underline">
                      {item.label}
                    </AccordionTrigger>
                    <AccordionContent className="pb-2">
                      {showsMegaPanelContent ? (
                        <NavbarMobileColumnList
                          links={children}
                          pathname={pathname}
                          onNavigate={onNavigate}
                          className="pl-2"
                        />
                      ) : (
                        <NavLinkList
                          links={children}
                          pathname={pathname}
                          onNavigate={onNavigate}
                          className="pl-2"
                        />
                      )}
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
                  icon={item.icon}
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
  collapseAt = "tablet",
  pathname,
  appearanceVars,
}: {
  items?: NavItemUi[];
  collapseAt?: NavbarCollapse;
  pathname?: string | null;
  /** Navigation style variables, repeated here because the sheet is portaled. */
  appearanceVars?: Record<string, string>;
}) => {
  const [open, setOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={MOBILE_TRIGGER_VISIBILITY[collapseAt]}
          aria-label="Open menu"
        >
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="puck-nav-sheet overflow-y-auto px-0 py-6"
        style={appearanceVars}
      >
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
