import {
  Blend,
  Blocks,
  BookImage,
  BookText,
  BookUp,
  Box,
  Boxes,
  ChartLine,
  ClipboardPen,
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
  ReceiptText,
  Settings,
  Shapes,
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
    title: "Ebooks",
    label: "",
    href: "/admin/ebooks",
    icon: BookText,
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
    title: "SEPARATOR_1",
    label: "SEPARATOR_1",
    href: "#",
  },
  {
    title: "Coverage",
    label: "",
    href: "",
    icon: BookUp,
    sub: [
      {
        title: "First impressions",
        label: "",
        href: "/admin/coverage/impressions",
        icon: ClipboardPen,
      },

      // {
      //   title: "Formats",
      //   label: "",
      //   href: "/admin/coverage/formats",
      //   icon: Shapes,
      // },
      // {
      //   title: "Genres",
      //   label: "",
      //   href: "/admin/coverage/genres",
      //   icon: Blend,
      // },
    ],
  },
  {
    title: "Contact Requests",
    label: "",
    href: "/admin/contacts",
    icon: ReceiptText,
  },
  {
    title: "SEPARATOR_2",
    label: "SEPARATOR_2",
    href: "#",
  },
  {
    title: "Products",
    label: "",
    href: "/admin/products",
    icon: Box,
  },
  // {
  //   title: "SEO",
  //   label: "",
  //   href: "/admin/seo",
  //   icon: ChartLine,
  // },
  // {
  //   title: "SEPARATOR_3",
  //   label: "SEPARATOR_3",
  //   href: "#",
  // },
  {
    title: "Settings",
    label: "",
    href: "/admin/settings",
    icon: Settings,
  },
  {
    title: "Users",
    label: "",
    href: "/admin/users",
    icon: Users,
  },
];
