"use client";

import { useSearchParams } from "next/navigation";
import { Language } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LanguageSwitcherProps {
  languages: Language[];
  onLanguageChange: (langId: string) => void;
}

function getFlagEmoji(countryCode: string) {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    //@ts-ignore
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

export const LanguageSwitcher = ({
  languages,
  onLanguageChange,
}: LanguageSwitcherProps) => {
  const searchParams = useSearchParams();

  const currentLangId = searchParams.get("langId");

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <Button
          key={lang.id}
          onClick={() => onLanguageChange(lang.id)}
          type="button"
          className={cn(`px-4 py-2 rounded`)}
          variant={
            lang.id === currentLangId || (!currentLangId && lang.isDefault)
              ? "default"
              : "outline"
          }
        >
          {getFlagEmoji(lang.code)}
        </Button>
      ))}
    </div>
  );
};
