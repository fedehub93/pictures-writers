"use client";

import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { Nav } from "./nav";

export const MobileNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onLinkClick = () => {
    setIsOpen(false); // Chiudi lo Sheet al click su un Link
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 md:hidden"
          onClick={() => setIsOpen(true)}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only"> Toggle Mobile Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col px-0 py-10">
        <SheetTitle className="text-3xl font-light w-full flex items-center justify-center">
          Menu
        </SheetTitle>
        <Nav isMobile onLinkClick={onLinkClick} />
      </SheetContent>
    </Sheet>
  );
};
