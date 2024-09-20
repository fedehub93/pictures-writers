import {
  Blocks,
  BookImage,
  BookText,
  Boxes,
  ChartLine,
  Contact,
  Group,
  LayoutDashboard,
  LayoutPanelTop,
  LibraryBig,
  LucideIcon,
  MailPlus,
  Mailbox,
  Mails,
  NotebookPen,
  Settings,
  Tags,
  Users,
} from "lucide-react";

import { SideLink } from "./nav/types";

export const sideLinks: SideLink[] = [
  {
    title: "Dashboard",
    label: "",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Contents",
    label: "",
    href: "",
    icon: LibraryBig,
    sub: [
      {
        title: "Posts",
        label: "",
        href: "/admin/posts",
        icon: NotebookPen,
      },
      {
        title: "Categories",
        label: "",
        href: "/admin/categories",
        icon: Boxes,
      },
      {
        title: "Tags",
        label: "",
        href: "/admin/tags",
        icon: Tags,
      },
      {
        title: "Media",
        label: "",
        href: "/admin/media",
        icon: BookImage,
      },
    ],
  },
  {
    title: "Mails",
    label: "",
    href: "",
    icon: Mails,
    sub: [
      {
        title: "Single Sends",
        label: "",
        href: "/admin/mails/single-sends",
        icon: MailPlus,
      },
      {
        title: "Contacts",
        label: "",
        href: "/admin/mails/audiences",
        icon: Contact,
      },
      {
        title: "Email templates",
        label: "",
        href: "/admin/mails/templates",
        icon: LayoutPanelTop,
      },
      {
        title: "Settings",
        label: "",
        href: "/admin/mails/settings",
        icon: Settings,
      },
    ],
  },
  {
    title: "Ebooks",
    label: "",
    href: "/admin/ebooks",
    icon: BookText,
  },
  {
    title: "SEO",
    label: "",
    href: "/admin/seo",
    icon: ChartLine,
  },
  {
    title: "Users",
    label: "",
    href: "/admin/users",
    icon: Users,
  },
];
