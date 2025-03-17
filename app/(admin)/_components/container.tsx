"use client";

import { User } from "@prisma/client";

import { cn } from "@/lib/utils";

interface ContainerProps {
  children: React.ReactNode;
  user: User;
}

export const Container = ({ children, user }: ContainerProps) => {
  return (
    <div
      className={cn(
        "overflow-x-hidden transition-[margin] md:pt-0 overflow-y-hidden relative h-full "
      )}
    >
      <div className="flex flex-col h-full">
        <div className="px-4 py-6 md:px-8 overflow-auto">{children}</div>
      </div>
    </div>
  );
};
