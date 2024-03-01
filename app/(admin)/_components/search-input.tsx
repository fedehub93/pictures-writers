"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import qs from "query-string";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/app/(admin)/_hooks/use-debounce";

export const SearchInput = () => {
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("title") || "");
  const debouncedValue = useDebounce(value);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("title", debouncedValue);
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedValue, router, pathname, searchParams]);

  return (
    <div className="relative">
      <Search className="h-4 w-4 absolute top-3 left-3 text-slate-600" />
      <Input
        onChange={(e) => setValue(e.target.value)}
        value={value}
        className="w-full md:w-[300px] pl-9 rounded-full bg-slate-100 focus-visible:ring-slate-200"
        placeholder="Search for a course"
      />
    </div>
  );
};
