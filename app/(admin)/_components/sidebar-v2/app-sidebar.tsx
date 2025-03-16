import * as React from "react";
import {
  Blocks,
  BookImage,
  BookUp,
  Box,
  Boxes,
  ChevronRight,
  ClipboardPen,
  Contact,
  GalleryVerticalEnd,
  LayoutDashboard,
  LayoutPanelTop,
  LibraryBig,
  MailPlus,
  Mails,
  Minus,
  NotebookPen,
  Plus,
  ReceiptText,
  Settings,
  ShoppingBag,
  Tags,
  Users,
} from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import Logo from "@/components/logo";
import Link from "next/link";

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
        {
          title: "Media",
          url: "/admin/media",
          Icon: BookImage,
        },
      ],
    },
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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
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
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={index === 1}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuAction className="data-[state=open]:rotate-90">
                          <ChevronRight />
                          <span className="sr-only">Toggle</span>
                        </SidebarMenuAction>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link href={subItem.url}>
                                  {subItem.Icon && <subItem.Icon />}
                                  {subItem.title}{" "}
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
