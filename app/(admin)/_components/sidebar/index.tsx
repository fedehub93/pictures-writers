"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";

import { cn } from "@/lib/utils";
import Logo from "@/components/logo";
import { useSidebar } from "@/store/use-sidebar";

import { Wrapper } from "./wrapper";
import { Toggle } from "./toggle";
import { Nav } from "./nav/nav";
import { sideLinks } from "./data";

interface SidebarProps {
  siteName?: string | null;
  logoUrl?: string | null;
}

export const Sidebar = ({ siteName = "Site Name", logoUrl }: SidebarProps) => {
  const { collapsed } = useSidebar((state) => state);

  return (
    <Wrapper>
      <Link
        href="/admin"
        className="flex flex-none gap-x-2 h-16 items-center bg-background p-4 shadow-2xs dark:shadow-white"
      >
        <Logo />
        <span
          className={cn(
            "text-sm uppercase font-bold mt-1",
            collapsed && "hidden"
          )}
        >
          {siteName}
        </span>
      </Link>
      <Toggle />
      <ScrollArea className="flex flex-col h-full">
        <Nav links={sideLinks} />
      </ScrollArea>
    </Wrapper>
  );
};
