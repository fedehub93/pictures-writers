"use client";

import { cn } from "@/shared/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
}

export const Container = ({ children }: ContainerProps) => {
  return (
    <div
      className={cn(
        "relative flex flex-col flex-1 min-h-0 transition-[margin] md:pt-0",
      )}
    >
      <div className="flex-1 overflow-y-auto">{children}</div>
    </div>
  );
};
