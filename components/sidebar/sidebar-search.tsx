"use client";

import { SearchInput } from "@/app/(admin)/_components/search-input";

const SidebarSearch = () => {
  return (
    <div className="w-full bg-white px-6 py-8 shadow-md">
      <h3 className="mb-4 text-sm font-extrabold uppercase">Search</h3>
      <SearchInput />
    </div>
  );
};

export default SidebarSearch;
