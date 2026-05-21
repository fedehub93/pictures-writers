import {
  Blocks,
  BookImage,
  BookUp,
  Box,
  Boxes,
  ClipboardPen,
  Contact,
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
    href: "#",
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
    href: "#",
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
    href: "#",
    icon: BookUp,
    sub: [
      {
        title: "First impressions",
        label: "",
        href: "/admin/coverage/impressions",
        icon: ClipboardPen,
      },
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
    title: "Shop",
    label: "",
    href: "#",
    icon: ShoppingBag,
    sub: [
      { title: "Products", label: "", href: "/admin/shop/products", icon: Box },
      {
        title: "Categories",
        label: "",
        href: "/admin/shop/categories",
        icon: Boxes,
      },
    ],
  },
  {
    title: "SEPARATOR_3",
    label: "SEPARATOR_3",
    href: "#",
  },
  {
    title: "Widgets",
    label: "",
    href: "/admin/widgets",
    icon: Blocks,
  },
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
