"use client";

import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { useDebounce } from "@/app/(admin)/_hooks/use-debounce";

export const SearchInput = () => {
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("s") || "");
  const debouncedValue = useDebounce(value);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("s", debouncedValue);
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedValue, router, pathname, searchParams]);

  return (
    <div className="relative">
      <Search className="h-4 w-4 absolute top-3 left-3 text-slate-600" />
      <Input
        onChange={(e) => setValue(e.target.value)}
        value={value}
        className="pl-9 max-w-sm"
        placeholder="Search for a asset..."
      />
    </div>
  );
};
