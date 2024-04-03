"use client";

import Logo from "./logo";
import { Actions } from "./actions";
import { useSidebar } from "@/store/use-sidebar";
import { MobileSidebar } from "../sidebar/mobile-sidebar";

export const Navbar = () => {
  return (
    <div className="flex flex-none items-center gap-4 bg-background h-16 shadow p-4 md:px-8">
      <MobileSidebar />

      <nav className="hidden items-center space-x-4 md:flex lg:space-x-6">
        Overview
      </nav>
      <div className="ml-auto">
        <Actions />
      </div>
    </div>
  );
};
