"use client";

import * as React from "react";
import {
  Blocks,
  BookImage,
  BookUp,
  Box,
  Boxes,
  Building,
  ClipboardPen,
  Contact,
  Icon,
  LayoutDashboard,
  LayoutPanelTop,
  LibraryBig,
  MailPlus,
  Mails,
  NotebookPen,
  ReceiptText,
  Settings,
  ShoppingBag,
  Tags,
  Theater,
  Trophy,
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
import Link from "next/link";
import { NavMain } from "./nav-main";

// This is sample data.
const data = {
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
          label: "",
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
