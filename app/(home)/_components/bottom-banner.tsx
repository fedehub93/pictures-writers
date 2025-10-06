import { Button } from "@/components/ui/button";
import Link from "next/link";

export const BottomBanner = () => {
  return (
    <div className=" w-full px-4 text-center py-1 md:py-4 border-b bg-accent fixed bottom-0">
      📚 <strong>Laboratorio di scrittura di un soggetto</strong> – 5 posti
      disponibili.
      <Link
        href="/laboratorio-di-scrittura-di-un-soggetto-cinematografico-2025/"
        type="button"
        role="button"
        className="font-semibold ml-1"
      >
        👉 <span className="underline">Scopri di più</span>
      </Link>
    </div>
  );
};
