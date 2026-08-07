"use client";

import * as React from "react";

import type { Route } from "next";
import Link from "next/link";

import {
  BlocksIcon,
  BookImageIcon,
  BookUpIcon,
  BoxIcon,
  BoxesIcon,
  ClipboardPenIcon,
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
import { NavMain } from "./nav-main";

// This is sample data.

export type NavObject = {
  title: string;
  url: Route;
  Icon?: LucideIcon;
  items?: {
    title: string;
    url: Route;
    Icon?: LucideIcon;
  }[];
};

const data: Record<string, NavObject[]> = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      Icon: LayoutDashboardIcon,
    },
    {
      title: "Pages",
      url: "/admin/pages",
      Icon: LayoutPanelTopIcon,
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
        },
        {
          title: "Categories",
          url: "/admin/categories",
          Icon: BoxesIcon,
        },
        {
          title: "Tags",
          url: "/admin/tags",
          Icon: TagsIcon,
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
        },
        {
          title: "Categories",
          url: "/admin/shop/categories",
          Icon: BoxesIcon,
        },
        {
          title: "Reviews",
          url: "/admin/shop/reviews",
          Icon: StarIcon,
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
        },
        {
          title: "Contacts",
          url: "/admin/mails/audiences",
          Icon: ContactIcon,
        },
        {
          title: "Email templates",
          url: "/admin/mails/templates",
          Icon: LayoutPanelTopIcon,
        },
        {
          title: "Settings",
          url: "/admin/mails/settings",
          Icon: SettingsIcon,
        },
      ],
    },
    {
      title: "Widgets",
      url: "/admin/widgets",
      Icon: BlocksIcon,
    },
    {
      title: "Ads",
      url: "/admin/ads",
      Icon: MegaphoneIcon,
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
        },
        {
          title: "Submissions",
          url: "/admin/submissions",
          Icon: InboxIcon,
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      Icon: SettingsIcon,
    },
  ],
  others: [
    {
      title: "Media",
      url: "/admin/media",
      Icon: BookImageIcon,
    },
    {
      title: "Coverage",
      url: "#",
      Icon: BookUpIcon,
      items: [
        {
          title: "First impressions",
          url: "/admin/coverage/impressions",
          Icon: ClipboardPenIcon,
        },
      ],
    },
    {
      title: "Users",
      url: "/admin/users",
      Icon: UsersIcon,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
        <NavMain label="Blog" items={data.navMain} />
        <NavMain label="Shop" items={data.shop} />
        <NavMain label="Tools" items={data.tools} />
        <NavMain label="Others" items={data.others} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
