import type { Route } from "next";

import {
  AtSignIcon,
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
  type LucideIcon,
  MailPlusIcon,
  MegaphoneIcon,
  NotebookPenIcon,
  PlugIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  StarIcon,
  TagsIcon,
  UsersIcon,
  UsersRoundIcon,
  WorkflowIcon,
} from "lucide-react";

import { hasPermission } from "@/shared/lib/permissions";

export type NavItem = {
  title: string;
  url: Route;
  Icon?: LucideIcon;
  permission?: string;
};

/**
 * A labelled cluster of nav items. The label describes the job the user is
 * doing; it never appears in the URL.
 */
export type NavSection = {
  label?: string;
  items: NavItem[];
};

export const navData: NavSection[] = [
  {
    items: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        Icon: LayoutDashboardIcon,
        permission: "dashboard.read",
      },
      {
        title: "Inbox",
        url: "/admin/inbox",
        Icon: InboxIcon,
        permission: "mail.read",
      },
    ],
  },
  {
    label: "Content",
    items: [
      {
        title: "Pages",
        url: "/admin/pages",
        Icon: LayoutPanelTopIcon,
        permission: "pages.read",
      },
      {
        title: "Posts",
        url: "/admin/posts",
        Icon: NotebookPenIcon,
        permission: "posts.read",
      },
      {
        title: "Media",
        url: "/admin/media",
        Icon: BookImageIcon,
        permission: "media.read",
      },
      {
        title: "Schedule",
        url: "/admin/schedule",
        Icon: CalendarCheckIcon,
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
      {
        title: "Widgets",
        url: "/admin/widgets",
        Icon: BlocksIcon,
        permission: "widgets.read",
      },
    ],
  },
  {
    label: "Marketing",
    items: [
      {
        title: "Single Sends",
        url: "/admin/marketing/single-sends",
        Icon: MailPlusIcon,
        permission: "single-sends.read",
      },
      {
        title: "Templates",
        url: "/admin/marketing/templates",
        Icon: LayoutPanelTopIcon,
        permission: "templates.read",
      },
      {
        title: "Audiences",
        url: "/admin/marketing/audiences",
        Icon: ContactIcon,
        permission: "audiences.read",
      },
      {
        title: "Contacts",
        url: "/admin/marketing/contacts",
        Icon: UsersRoundIcon,
        permission: "contacts.read",
      },
      {
        title: "Ads",
        url: "/admin/ads",
        Icon: MegaphoneIcon,
        permission: "ads.read",
      },
      {
        title: "Forms",
        url: "/admin/forms",
        Icon: FormIcon,
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
    label: "Shop",
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
      {
        title: "Customers",
        url: "/admin/shop/customers" as Route,
        Icon: UsersRoundIcon,
        permission: "customers.read",
      },
      {
        title: "Orders",
        url: "/admin/shop/orders" as Route,
        Icon: ReceiptTextIcon,
        permission: "orders.read",
      },
    ],
  },
  {
    label: "Automations",
    items: [
      {
        title: "All automations",
        url: "/admin/automations/" as Route,
        Icon: WorkflowIcon,
        permission: "automations.read",
      },
      {
        title: "Credentials",
        url: "/admin/automations/credentials" as Route,
        Icon: ShieldCheckIcon,
        permission: "automations.read",
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "General",
        url: "/admin/settings",
        Icon: SettingsIcon,
        permission: "settings.read",
      },
      {
        title: "Integrations",
        url: "/admin/integrations" as Route,
        Icon: PlugIcon,
        permission: "integrations.read",
      },
      {
        title: "Email accounts",
        url: "/admin/email-accounts",
        Icon: AtSignIcon,
        permission: "email-accounts.read",
      },
      {
        title: "Email settings",
        url: "/admin/email-settings",
        Icon: SlidersHorizontalIcon,
        permission: "email-settings.read",
      },
    ],
  },
  {
    label: "Access",
    items: [
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
  },
];

/**
 * Keep only the nav items the user can reach, dropping sections left empty.
 * Items are leaves: there is no nested parent whose children must survive.
 */
export function filterNavData(
  data: readonly NavSection[],
  permissionKeys: readonly string[],
): NavSection[] {
  const allows = (permission?: string) =>
    !permission || hasPermission(permissionKeys, permission);

  return data
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => allows(item.permission)),
    }))
    .filter((section) => section.items.length > 0);
}

/**
 * The nav entry the current path belongs to. When one entry is a prefix of
 * another (Automations vs Credentials, General vs its settings tabs), the most
 * specific match wins so exactly one entry is highlighted.
 */
export function getActiveNavUrl(
  sections: readonly NavSection[],
  pathname: string,
): string | undefined {
  const current = pathname.replace(/\/$/, "");
  let active: string | undefined;

  for (const section of sections) {
    for (const item of section.items) {
      const href = item.url.replace(/\/$/, "");
      const matches = current === href || current.startsWith(`${href}/`);
      if (matches && (!active || href.length > active.replace(/\/$/, "").length)) {
        active = item.url;
      }
    }
  }

  return active;
}
