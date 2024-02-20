import { usePathname } from "next/navigation";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSidebar } from "@/store/use-sidebar";
import { cn } from "@/lib/utils";

interface MenuItemProps {
  label: string;
  href: string;
  icon?: LucideIcon;
}

export const MenuItem = ({ label, href, icon: Icon }: MenuItemProps) => {
  const pathname = usePathname();

  const { collapsed } = useSidebar();

  const isActive = pathname === href;

  return (
    <Button
      asChild
      variant="ghost"
      className={cn(
        "w-full h-12",
        collapsed ? "justify-center" : "justify-start",
        isActive && "bg-accent"
      )}
    >
      <Link href={href}>
        <div
          className={cn(
            "w-full flex items-center gap-x-4 ",
            collapsed && "justify-center"
          )}
        >
          {Icon && <Icon className="w-6 h-6" strokeWidth={1.5} />}
          {!collapsed && <p className="truncate">{label}</p>}
        </div>
      </Link>
    </Button>
  );
};
