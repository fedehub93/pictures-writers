"use client";

import { ScrollArea } from "@/components/ui/scroll-area";

import { Wrapper } from "./wrapper";
import { Toggle } from "./toggle";
import Logo from "../navbar/logo";
import { Nav } from "./nav/nav";
import { sideLinks } from "./data";

export const Sidebar = () => {
  return (
    <Wrapper>
      <div className="flex flex-none h-16 items-center gap-4 bg-background p-4 sticky top-0 justify-between shadow-sm dark:shadow-white md:px-4">
        <Logo />
      </div>
      <Toggle />
      <ScrollArea className="flex flex-col h-full">
        <Nav links={sideLinks} />
      </ScrollArea>
    </Wrapper>
  );
};
