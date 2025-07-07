"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Language } from "@prisma/client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSwitcherProps {
  languages: Language[];
}

export const LanguageSwitcher = ({ languages }: LanguageSwitcherProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentLangId = searchParams.get("langId");

  const langId =
    currentLangId || (languages.find((l) => l.isDefault)?.id as string);

  const onLanguageChange = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("langId", id);

    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 items-center">
      {/* {languages.map((lang) => (
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
          {lang.name}
        </Button>
      ))} */}
      <Select value={langId} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {languages.map((lang) => (
            <SelectItem key={lang.id} value={lang.id}>
              {lang.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
