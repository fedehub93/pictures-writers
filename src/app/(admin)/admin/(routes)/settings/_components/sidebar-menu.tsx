"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const routes: {label:string, href: Route}[] = [
  {
    label: "Main",
    href: "/admin/settings/main",
  },
  {
    label: "Seo",
    href: "/admin/settings/seo",
  },
  {
    label: "Socials",
    href: "/admin/settings/socials",
  },
  {
    label: "Scripts",
    href: "/admin/settings/scripts",
  },
  {
    label: "Languages",
    href: "/admin/settings/languages",
  },
  {
    label: "Database",
    href: "/admin/settings/database",
  },
];

export const SidebarMenu = () => {
  const pathname = usePathname();

  return (
    <aside className="lg:w-1/5">
      <nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-0 gap-y-1">
        {routes.map((r) => {
          const isActive = pathname.startsWith(r.href);
          return (
            <Link
              key={r.label}
              href={r.href}
              className={cn(
                `font-medium text-sm py-2 px-4 rounded-md`,
                !isActive && `hover:underline`,
                isActive && `bg-muted`
              )}
            >
              {r.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
