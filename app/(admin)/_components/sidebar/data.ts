import {
  Blocks,
  BookImage,
  Boxes,
  LayoutDashboard,
  LayoutPanelTop,
  LibraryBig,
  LucideIcon,
  Mailbox,
  Mails,
  NotebookPen,
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
      {
        title: "Email templates",
        label: "",
        href: "/admin/mails/templates",
        icon: LayoutPanelTop,
      },
      {
        title: "Newsletters",
        label: "",
        href: "/admin/mails/newsletters",
        icon: Mailbox,
      },
    ],
  },
];
