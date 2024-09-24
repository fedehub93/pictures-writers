"use client";

import { useEffect } from "react";
import { useMediaQuery } from "usehooks-ts";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/store/use-sidebar";
import { Navbar } from "./navbar";
import { User } from "@prisma/client";

interface ContainerProps {
  children: React.ReactNode;
  user: User;
}

export const Container = ({ children, user }: ContainerProps) => {
  const matches = useMediaQuery("(max-width: 1024px)");
  const { collapsed, onCollapse, onExpand } = useSidebar((state) => state);

  useEffect(() => {
    if (matches) {
      onCollapse();
    } else {
      onExpand();
    }
  }, [matches, onCollapse, onExpand]);

  return (
    <div
      className={cn(
        "overflow-x-hidden transition-[margin] md:pt-0 md:overflow-y-hidden relative h-full ",
        collapsed ? "sm:ml-[70px]" : "sm:ml-[70px] lg:ml-60"
      )}
    >
      <div className="flex flex-col h-full">
        <Navbar user={user}/>
        <div className="px-4 py-6 md:px-8 h-[calc(100%-4rem)]">{children}</div>
      </div>
    </div>
  );
};
