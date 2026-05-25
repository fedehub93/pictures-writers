"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type Route } from "next";

import Cookies from "js-cookie";

import { Button } from "@/shared/ui/button";

export const BottomBanner = () => {
  const [isOpen, setIsOpen] = useState(false);

  const path =
    "/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/" as Route;

  useEffect(() => {
    // Verifica se esiste il cookie
    const isDismissed = Cookies.get("dismiss_bottom_banner");
    if (!isDismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    Cookies.set("dismiss_bottom_banner", "true", { expires: 7 });
  };

  if (!isOpen) return null;

  return (
    <div className="w-full px-4 text-center py-1 md:py-4 border-b bg-accent fixed bottom-0 border-t border-t-primary/30">
      <Button
        onClick={handleClose}
        type="button"
        className="absolute left-1/2 -translate-x-1/2 -top-4 bg-primary h-4 text-primary-foreground text-xs px-2 rounded-t rounded-b-none"
      >
        Chiudi
      </Button>
      📚 <strong>Laboratorio di scrittura di un soggetto</strong> – 2 posti
      disponibili.
      <Link
        href={path}
        type="button"
        role="button"
        className="font-semibold ml-1"
      >
        👉 <span className="underline">Scopri di più</span>
      </Link>
    </div>
  );
};
