import {
  Blocks,
  BookImage,
  Boxes,
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
      { title: "Write", label: "", href: "/admin/mails/write", icon: MailPlus },
      {
        title: "Newsletters",
        label: "",
        href: "/admin/mails/newsletters",
        icon: Mailbox,
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
];
