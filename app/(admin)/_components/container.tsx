"use client";

import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
}

export const Container = ({ children }: ContainerProps) => {
  return (
    <div
      className={cn(
        "overflow-x-hidden transition-[margin] md:pt-0 overflow-y-hidden relative h-full ",
      )}
    >
      <div className="flex flex-col h-full">
        <div className="overflow-auto">{children}</div>
      </div>
    </div>
  );
};
