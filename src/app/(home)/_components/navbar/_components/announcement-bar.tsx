"use client";

import Link from "next/link";
import { sendGTMEvent } from "@next/third-parties/google";
import type { Route } from "next";

const LAB_URL =
  "/shop/corsi-di-sceneggiatura/laboratorio-di-scrittura-di-un-soggetto/" as Route;

export const AnnouncementBar = () => {
  const onClick = () => {
    sendGTMEvent({
      event: "cta_click",
      cta_id: "announcement_bar",
      cta_label: "Scopri il laboratorio",
      page_path: window.location.pathname,
    });
  };

  return (
    <Link
      href={LAB_URL}
      prefetch={false}
      onClick={onClick}
      className="flex h-12 items-center justify-center bg-primary px-4 text-center text-primary-foreground md:h-8"
    >
      <span className="flex flex-col items-center gap-y-0.5 text-xs leading-tight md:hidden">
        <span className="font-semibold">Scrivi il tuo soggetto</span>
        <span>
          Iscrizioni fino al 27 ottobre ·{" "}
          <span className="font-semibold whitespace-nowrap underline underline-offset-2">
            Scopri →
          </span>
        </span>
      </span>
      <span className="hidden items-center gap-x-2 text-xs md:flex">
        <span>Scrivi il tuo soggetto · iscrizioni fino al 27 ottobre</span>
        <span className="font-semibold whitespace-nowrap underline underline-offset-2">
          Scopri il laboratorio →
        </span>
      </span>
    </Link>
  );
};
