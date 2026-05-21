"use client";

import { useSidebar } from "@/store/use-sidebar";

interface MenuGroupProps {
  children: React.ReactNode;
  label: string;
}

export const MenuGroup = ({ children, label }: MenuGroupProps) => {
  const { collapsed } = useSidebar();

  const showLabel = !collapsed;
  return (
    <div className="flex flex-col">
      {showLabel && (
        <div className="pl-6 mb-4">
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      )}
      <ul className="px-2">{children}</ul>
    </div>
  );
};
