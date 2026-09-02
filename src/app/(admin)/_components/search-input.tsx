"use client";

import { Search, SearchIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/shared/ui/input";
import { useDebounce } from "@/app/(admin)/_hooks/use-debounce";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/shared/ui/input-group";

export const SearchInput = () => {
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("s") || "");
  const debouncedValue = useDebounce(value);

  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    params.set("s", debouncedValue);
    router.push(`/admin/media?${params.toString()}`);
  }, [debouncedValue, router, searchParams]);

  return (
    <div className="relative">
      <InputGroup>
        <InputGroupInput
          placeholder="Search..."
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
        <InputGroupAddon>
          <SearchIcon />
        </InputGroupAddon>
      </InputGroup>
    </div>
  );
};
