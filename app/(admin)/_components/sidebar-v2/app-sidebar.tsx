"use client";

import * as React from "react";

import type { Route } from "next";
import Link from "next/link";

import {
  Blocks,
  BookImage,
  BookUp,
  Box,
  Boxes,
  ClipboardPen,
  ClipboardPenLine,
  Contact,
  FilePenLine,
  Inbox,
  LayoutDashboard,
  LayoutPanelTop,
  LibraryBig,
  List,
  LucideIcon,
  Mail,
  MailPlus,
  Mails,
  Megaphone,
  NotebookPen,
  Puzzle,
  ReceiptText,
  Settings,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Logo from "@/components/logo";
import { NavMain } from "./nav-main";
import { title } from "process";

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
      Icon: LayoutDashboard,
    },
    {
      title: "Contents",
      url: "#",
      Icon: LibraryBig,
      items: [
        {
          title: "Posts",
          url: "/admin/posts",
          Icon: NotebookPen,
        },
        {
          title: "Categories",
          url: "/admin/categories",
          Icon: Boxes,
        },
        {
          title: "Tags",
          url: "/admin/tags",
          Icon: Tags,
        },
      ],
    },
  ],
  shop: [
    {
      title: "Shop",
      url: "#",
      Icon: ShoppingBag,
      items: [
        {
          title: "Products",
          url: "/admin/shop/products",
          Icon: Box,
        },
        {
          title: "Categories",
          url: "/admin/shop/categories",
          Icon: Boxes,
        },
      ],
    },
  ],
  tools: [
    {
      title: "Mails",
      url: "#",
      Icon: Mails,
      items: [
        {
          title: "Single Sends",
          url: "/admin/mails/single-sends",
          Icon: MailPlus,
        },
        {
          title: "Contacts",
          url: "/admin/mails/audiences",
          Icon: Contact,
        },
        {
          title: "Email templates",
          url: "/admin/mails/templates",
          Icon: LayoutPanelTop,
        },
        {
          title: "Settings",
          url: "/admin/mails/settings",
          Icon: Settings,
        },
      ],
    },
    {
      title: "Widgets",
      url: "/admin/widgets",
      Icon: Blocks,
    },
    {
      title: "Ads",
      url: "/admin/ads",
      Icon: Megaphone,
    },
    {
      title: "Forms",
      url: "#",
      Icon: Puzzle,
      items: [
        {
          title: "All forms",
          url: "/admin/forms",
          Icon: List,
        },
        {
          title: "Submissions",
          url: "/admin/submissions",
          Icon: Mail,
        },
      ],
    },
    {
      title: "Settings",
      url: "/admin/settings",
      Icon: Settings,
    },
  ],
  others: [
    {
      title: "Media",
      url: "/admin/media",
      Icon: BookImage,
    },
    {
      title: "Coverage",
      url: "#",
      Icon: BookUp,
      items: [
        {
          title: "First impressions",
          url: "/admin/coverage/impressions",
          Icon: ClipboardPen,
        },
      ],
    },
    {
      title: "Contact Requests",
      url: "/admin/contacts",
      Icon: ReceiptText,
    },

    {
      title: "Users",
      url: "/admin/users",
      Icon: Users,
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
