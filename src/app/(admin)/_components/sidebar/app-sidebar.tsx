"use client";

import * as React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

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
import { hasPermission, PERMISSIONS } from "@/shared/lib/permissions";
import { useMailboxCounts } from "@/modules/mails/conversations/hooks/use-mailbox-counts";

import { NavMain } from "./nav-main";
import { filterNavData, getActiveNavUrl, navData } from "./nav-data";
import { getNavBadges } from "./nav-badges";

export function AppSidebar({
  permissionKeys,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  permissionKeys: readonly string[];
}) {
  const pathname = usePathname();
  const visibleData = filterNavData(navData, permissionKeys);
  const activeUrl = getActiveNavUrl(visibleData, pathname);

  const canReadMail = hasPermission(permissionKeys, PERMISSIONS.MAIL_READ);
  const { data: counts } = useMailboxCounts(canReadMail);

  const badges = getNavBadges(permissionKeys, counts?.totalUnread);

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
        {visibleData.map((section) => (
          <NavMain
            key={section.label ?? section.items[0]?.title}
            label={section.label}
            items={section.items}
            activeUrl={activeUrl}
            badges={badges}
          />
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
