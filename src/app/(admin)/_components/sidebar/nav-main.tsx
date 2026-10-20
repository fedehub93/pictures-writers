"use client";

import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/shared/ui/sidebar";

import { type NavItem } from "./nav-data";

export function NavMain({
  label,
  items,
  activeUrl,
}: {
  label?: string;
  items: NavItem[];
  activeUrl?: string;
}) {
  return (
    <SidebarGroup className="py-1.5">
      {label ? (
        <SidebarGroupLabel className="h-7 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarMenu className="gap-0.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild isActive={item.url === activeUrl}>
              <Link href={item.url}>
                {item.Icon && <item.Icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
