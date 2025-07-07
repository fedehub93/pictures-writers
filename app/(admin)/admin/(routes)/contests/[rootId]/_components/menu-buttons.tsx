"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";

const menu = [
  {
    label: "Details",
    path: "details",
  },
  {
    label: "Copy",
    path: "copy",
  },
  {
    label: "Categories",
    path: "categories",
  },
  {
    label: "Deadlines",
    path: "deadlines",
  },
  {
    label: "Prices",
    path: "prices",
  },
  {
    label: "Announcements",
    path: "stages",
  },
];

interface MenuButtonsProps {
  rootId: string;
}

export const MenuButtons = ({ rootId }: MenuButtonsProps) => {
  const pathname = usePathname();

  const searchParams = useSearchParams();

  const query = searchParams.toString();

  return (
    <div className="flex justify-center gap-x-4">
      {menu.map((m) => {
        const isActive = pathname.includes(m.path);
        const href =
          `/admin/contests/${rootId}/${m.path}` + (query ? `?${query}` : "");

        return (
          <Button
            key={m.label}
            asChild
            variant={isActive ? "default" : "outline"}
          >
            <Link href={href}>{m.label}</Link>
          </Button>
        );
      })}
    </div>
  );
};
