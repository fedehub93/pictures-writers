"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Wrapper } from "./wrapper";
import { Toggle } from "./toggle";
import Logo from "../navbar/logo";
import { Nav } from "./nav/nav";
import { sideLinks } from "./data";
import Link from "next/link";

interface SidebarProps {
  siteName?: string | null;
  logoUrl?: string | null;
}

export const Sidebar = ({ siteName = "Site Name", logoUrl }: SidebarProps) => {
  return (
    <Wrapper>
      <Link
        href="/admin/dashboard"
        className="flex flex-none h-16 items-center gap-4 bg-background p-4 sticky top-0 justify-between shadow-sm dark:shadow-white md:px-4"
      >
        <Logo logoUrl={logoUrl} />
      </Link>
      <Toggle />
      <ScrollArea className="flex flex-col h-full">
        <Nav links={sideLinks} />
      </ScrollArea>
    </Wrapper>
  );
};
