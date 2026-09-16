"use client";

import * as React from "react";

import type { Route } from "next";
import Link from "next/link";

import {
  BlocksIcon,
  BookImageIcon,
  BoxIcon,
  BoxesIcon,
  CalendarCheckIcon,
  ContactIcon,
  FormIcon,
  InboxIcon,
  LayoutDashboardIcon,
  LayoutPanelTopIcon,
  LibraryBigIcon,
  ListIcon,
  LucideIcon,
  MailPlusIcon,
  MailsIcon,
  MegaphoneIcon,
  NotebookPenIcon,
  SettingsIcon,
  ShoppingBagIcon,
  StarIcon,
  TagsIcon,
  UsersIcon,
  ShieldCheckIcon,
} from "lucide-react";

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
import { hasPermission } from "@/shared/lib/permissions";

import { NavMain } from "./nav-main";

// This is sample data.

export type NavObject = {
  title: string;
  url: Route;
  Icon?: LucideIcon;
  permission?: string;
  items?: {
    title: string;
    url: Route;
    Icon?: LucideIcon;
    permission?: string;
  }[];
};

const data: Record<string, NavObject[]> = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      Icon: LayoutDashboardIcon,
      permission: "dashboard.read",
    },
    {
      title: "Pages",
      url: "/admin/pages",
      Icon: LayoutPanelTopIcon,
      permission: "pages.read",
    },
    {
      title: "Schedule",
      url: "/admin/schedule",
      Icon: CalendarCheckIcon,
      permission: "posts.read",
    },
    {
      title: "Contents",
      url: "#",
      Icon: LibraryBigIcon,
      items: [
        {
          title: "Posts",
          url: "/admin/posts",
          Icon: NotebookPenIcon,
          permission: "posts.read",
        },
        {
          title: "Categories",
          url: "/admin/categories",
          Icon: BoxesIcon,
          permission: "categories.read",
        },
        {
          title: "Tags",
          url: "/admin/tags",
          Icon: TagsIcon,
          permission: "tags.read",
        },
      ],
    },
  ],
  shop: [
    {
      title: "Shop",
      url: "#",
      Icon: ShoppingBagIcon,
      items: [
        {
          title: "Products",
          url: "/admin/shop/products",
          Icon: BoxIcon,
          permission: "products.read",
        },
        {
          title: "Categories",
          url: "/admin/shop/categories",
          Icon: BoxesIcon,
          permission: "product-categories.read",
        },
        {
          title: "Reviews",
          url: "/admin/shop/reviews",
          Icon: StarIcon,
          permission: "reviews.read",
        },
      ],
    },
  ],
  tools: [
    {
      title: "Mails",
      url: "#",
      Icon: MailsIcon,
      items: [
        {
          title: "Single Sends",
          url: "/admin/mails/single-sends",
          Icon: MailPlusIcon,
          permission: "single-sends.read",
        },
        {
          title: "Contacts",
          url: "/admin/mails/audiences",
          Icon: ContactIcon,
          permission: "audiences.read",
        },
        {
          title: "Email templates",
          url: "/admin/mails/templates",
          Icon: LayoutPanelTopIcon,
          permission: "templates.read",
        },
        {
          title: "Settings",
          url: "/admin/mails/settings",
          Icon: SettingsIcon,
          permission: "email-settings.read",
        },
      ],
    },
    {
      title: "Widgets",
      url: "/admin/widgets",
      Icon: BlocksIcon,
      permission: "widgets.read",
    },
    {
      title: "Ads",
      url: "/admin/ads",
      Icon: MegaphoneIcon,
      permission: "ads.read",
    },
    {
      title: "Forms",
      url: "#",
      Icon: FormIcon,
      items: [
        {
          title: "All forms",
          url: "/admin/forms",
          Icon: ListIcon,
          permission: "forms.read",
        },
        {
          title: "Submissions",
          url: "/admin/submissions",
          Icon: InboxIcon,
          permission: "submissions.read",
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      Icon: SettingsIcon,
      permission: "settings.read",
    },
  ],
  others: [
    {
      title: "Media",
      url: "/admin/media",
      Icon: BookImageIcon,
      permission: "media.read",
    },
    {
      title: "Users",
      url: "/admin/users",
      Icon: UsersIcon,
      permission: "users.read",
    },
    {
      title: "Roles",
      url: "/admin/roles/" as Route,
      Icon: ShieldCheckIcon,
      permission: "roles.read",
    },
  ],
};

export function AppSidebar({
  permissionKeys,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  permissionKeys: readonly string[];
}) {
  const visibleData = Object.fromEntries(
    Object.entries(data).map(([section, items]) => [
      section,
      items
        .map((item) => ({
          ...item,
          items: item.items?.filter(
            (child) =>
              !child.permission ||
              hasPermission(permissionKeys, child.permission),
          ),
        }))
        .filter(
          (item) =>
            (!item.permission ||
              hasPermission(permissionKeys, item.permission)) &&
            (!item.items || item.items.length > 0),
        ),
    ]),
  ) as Record<string, NavObject[]>;
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
