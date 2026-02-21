"use client";

import { useRouter } from "next/navigation";

import { ProductAcquisitionMode } from "@/generated/prisma";
import { Route } from "next";

interface WebinarBottomCtaProps {
  acquisitionMode: ProductAcquisitionMode;
  ctaLabel?: string;
  price?: number | null;
  discountedPrice?: number | null;
}

export const WebinarBottomCta = ({
  acquisitionMode,
  ctaLabel,
  price,
  discountedPrice,
}: WebinarBottomCtaProps) => {
  const router = useRouter();

  const onCtaClick = () => {
    if (acquisitionMode === ProductAcquisitionMode.FORM) {
      router.push(`submission` as Route);
    } else {
      document
        .querySelector("#checkout-section")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg lg:hidden">
      <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Prezzo se presente */}
        {price ? (
          <div className="flex flex-col">
            {discountedPrice && discountedPrice !== price && (
              <span className="text-sm line-through text-muted-foreground">
                €{discountedPrice}
              </span>
            )}
            <span className="text-lg font-bold text-primary">€{price}</span>
          </div>
        ) : (
          <div />
        )}

        {/* CTA */}
        {acquisitionMode === ProductAcquisitionMode.FORM ? (
          <button
            className="bg-primary text-primary-foreground font-medium px-5 py-2 rounded-md shadow-md hover:bg-primary/90 transition"
            onClick={onCtaClick}
          >
            {ctaLabel || "Invia"}
          </button>
        ) : acquisitionMode === ProductAcquisitionMode.PAID ? (
          <button
            className="bg-primary text-primary-foreground font-medium px-5 py-2 rounded-md shadow-md hover:bg-primary/90 transition"
            onClick={() => {
              const section = document.querySelector("#summary");
              if (section) section.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Acquista ora
          </button>
        ) : null}
      </div>
    </div>
  );
};
