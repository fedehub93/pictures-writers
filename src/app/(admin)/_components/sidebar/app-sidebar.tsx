"use client";

import * as React from "react";

import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/shared/ui/sidebar";
import Logo from "@/shared/components/logo";

import { NavMain } from "./nav-main";
import { filterNavData, navData } from "./nav-data";

export function AppSidebar({
  permissionKeys,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  permissionKeys: readonly string[];
}) {
  const visibleData = filterNavData(navData, permissionKeys);

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/admin">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-secondary text-sidebar-primary-foreground">
                  <Logo />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Pictures Writers</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {visibleData.navMain.length > 0 && (
          <NavMain label="Blog" items={visibleData.navMain} />
        )}
        {visibleData.shop.length > 0 && (
          <NavMain label="Shop" items={visibleData.shop} />
        )}
        {visibleData.tools.length > 0 && (
          <NavMain label="Tools" items={visibleData.tools} />
        )}
        {visibleData.others.length > 0 && (
          <NavMain label="Others" items={visibleData.others} />
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
