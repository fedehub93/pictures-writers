import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

import { useSidebar } from "@/store/use-sidebar";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  label: string;
  href: Route;
  icon?: LucideIcon;
}

export const MenuItem = ({ label, href, icon: Icon }: MenuItemProps) => {
  const pathname = usePathname();

  const { collapsed } = useSidebar();

  const isActive = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn(
        " flex items-center text-sm gap-3 w-full py-2 text-muted-foreground transition-all hover:text-primary rounded-lg",
        collapsed ? "justify-center px-2" : "justify-start px-3",
        isActive && "bg-accent text-black font-medium"
      )}
    >
      {Icon && <Icon className="w-6 h-6" strokeWidth={1.5} />}
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );
};
