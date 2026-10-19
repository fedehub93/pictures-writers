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
  LibraryBigIcon,
  ListIcon,
  type LucideIcon,
  MailPlusIcon,
  MailsIcon,
  MegaphoneIcon,
  NotebookPenIcon,
  PlugIcon,
  ReceiptTextIcon,
  SettingsIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  StarIcon,
  TagsIcon,
  UsersIcon,
  UsersRoundIcon,
  WorkflowIcon,
} from "lucide-react";

import { hasPermission } from "@/shared/lib/permissions";
import { MAIL_SECTIONS } from "@/modules/mails/lib/sections";

export type NavItem = {
  title: string;
  url: Route;
  Icon?: LucideIcon;
  permission?: string;
};

/** A labelled cluster of items rendered inside a collapsible parent. */
export type NavGroup = {
  label: string;
  items: NavItem[];
};

export type NavObject = NavItem & {
  items?: NavItem[];
  groups?: NavGroup[];
};

export const navData: Record<string, NavObject[]> = {
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      Icon: LayoutDashboardIcon,
      permission: "dashboard.read",
    },
    {
      title: "Pages",
      url: "/admin/pages",
      Icon: LayoutPanelTopIcon,
      permission: "pages.read",
    },
    {
      title: "Schedule",
      url: "/admin/schedule",
      Icon: CalendarCheckIcon,
      permission: "posts.read",
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
  ],
  tools: [
    {
      title: "Mails",
      url: "#",
      Icon: MailsIcon,
      groups: [
        {
          label: MAIL_SECTIONS.marketing,
          items: [
            {
              title: "Templates",
              url: "/admin/mails/marketing/templates",
              Icon: LayoutPanelTopIcon,
              permission: "templates.read",
            },
            {
              title: "Audiences",
              url: "/admin/mails/marketing/audiences",
              Icon: ContactIcon,
              permission: "audiences.read",
            },
            {
              title: "Contacts",
              url: "/admin/mails/marketing/contacts",
              Icon: UsersRoundIcon,
              permission: "contacts.read",
            },
            {
              title: "Single Sends",
              url: "/admin/mails/marketing/single-sends",
              Icon: MailPlusIcon,
              permission: "single-sends.read",
            },
          ],
        },
        {
          label: MAIL_SECTIONS.conversations,
          items: [
            {
              title: "Inbox",
              url: "/admin/mails/conversations/inbox",
              Icon: InboxIcon,
              permission: "mail.read",
            },
            {
              title: "Accounts",
              url: "/admin/mails/conversations/accounts",
              Icon: AtSignIcon,
              permission: "email-accounts.read",
            },
          ],
        },
      ],
      items: [
        {
          title: "Settings",
          url: "/admin/mails/settings",
          Icon: SettingsIcon,
          permission: "email-settings.read",
        },
      ],
    },
    {
      title: "Widgets",
      url: "/admin/widgets",
      Icon: BlocksIcon,
      permission: "widgets.read",
    },
    {
      title: "Ads",
      url: "/admin/ads",
      Icon: MegaphoneIcon,
      permission: "ads.read",
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
      title: "Automations",
      url: "#",
      Icon: WorkflowIcon,
      permission: "automations.read",
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
      title: "Integrations",
      url: "/admin/integrations" as Route,
      Icon: PlugIcon,
      permission: "integrations.read",
    },
    {
      title: "Settings",
      url: "/admin/settings",
      Icon: SettingsIcon,
      permission: "settings.read",
    },
  ],
  others: [
    {
      title: "Media",
      url: "/admin/media",
      Icon: BookImageIcon,
      permission: "media.read",
    },
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
};

/**
 * Keep only the nav entries the user can reach. Child items and group items
 * are filtered by permission; parents whose children are all hidden (or that
 * had children to begin with and nothing to show now) are dropped.
 */
export function filterNavData(
  data: Record<string, NavObject[]>,
  permissionKeys: readonly string[],
): Record<string, NavObject[]> {
  const allows = (permission?: string) =>
    !permission || hasPermission(permissionKeys, permission);

  return Object.fromEntries(
    Object.entries(data).map(([section, items]) => [
      section,
      items.flatMap((item) => {
        if (!allows(item.permission)) return [];

        const hadChildren = Boolean(item.items || item.groups);

        const childItems = item.items?.filter((child) =>
          allows(child.permission),
        );
        const groups = item.groups
          ?.map((group) => ({
            ...group,
            items: group.items.filter((child) => allows(child.permission)),
          }))
          .filter((group) => group.items.length > 0);

        const hasVisibleChildren = Boolean(
          (childItems && childItems.length > 0) ||
            (groups && groups.length > 0),
        );

        if (hadChildren && !hasVisibleChildren) return [];

        return [
          {
            ...item,
            items:
              childItems && childItems.length > 0 ? childItems : undefined,
            groups: groups && groups.length > 0 ? groups : undefined,
          },
        ];
      }),
    ]),
  ) as Record<string, NavObject[]>;
}
