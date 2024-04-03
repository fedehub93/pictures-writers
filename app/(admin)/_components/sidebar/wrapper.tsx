"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/store/use-sidebar";

interface WrapperProps {
  children: React.ReactNode;
}

export const Wrapper = ({ children }: WrapperProps) => {
  const { collapsed } = useSidebar((state) => state);

  return (
    <aside
      className={cn(
        "fixed left-0 sm:flex flex-col w-60 h-full z-50 border-r border-r-zinc-300 transition-[width] hidden",
        collapsed && "w-[70px]"
      )}
    >
      {children}
    </aside>
  );
};
