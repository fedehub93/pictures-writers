"use client";

import Link from "next/link";
import type { Route } from "next";
import { useSuspenseQuery } from "@tanstack/react-query";

import { ContentStatus } from "@/generated/prisma";
import { useTRPC } from "@/trpc/client";
import { formatDate } from "@/lib/format";
import { cn, getFirstCharUppercase } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import type { WidgetComponentProps } from "@/shared/dashboard/types";
import { WidgetAuthorAvatar } from "@/shared/dashboard/ui/widget-author";
import {
  WidgetTable,
  WidgetTableSkeleton,
  type WidgetTableColumn,
} from "@/shared/dashboard/ui/widget-table";

import { DASHBOARD_LIST_LIMIT } from "../constants";

interface ContentRow {
  rootId: string;
  versionId: string;
  title: string;
  status: ContentStatus;
  updatedAt: Date;
  author: { name: string; imageUrl: string | null } | null;
  categories: { id: string; title: string }[];
}

const CONTENT_STATUSES: ContentStatus[] = [
  ContentStatus.DRAFT,
  ContentStatus.CHANGED,
  ContentStatus.SCHEDULED,
  ContentStatus.PUBLISHED,
];

const resolveStatuses = (value: unknown): ContentStatus[] | undefined => {
  if (!Array.isArray(value)) return undefined;

  const statuses = value.filter((item): item is ContentStatus =>
    CONTENT_STATUSES.includes(item as ContentStatus),
  );

  return statuses.length > 0 ? statuses : undefined;
};

const StatusBadge = ({ status }: { status: ContentStatus }) => (
  <Badge
    className={cn(
      status === ContentStatus.DRAFT && "bg-slate-700",
      status === ContentStatus.CHANGED && "bg-sky-700",
      status === ContentStatus.PUBLISHED && "bg-emerald-700",
      status === ContentStatus.SCHEDULED && "bg-primary",
    )}
  >
    {getFirstCharUppercase(status.toLowerCase())}
  </Badge>
);

const CategoryBadges = ({
  categories,
}: {
  categories: ContentRow["categories"];
}) => {
  if (categories.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const [first, ...rest] = categories;

  return (
    <div className="flex items-center justify-end gap-1">
      <Badge variant="secondary" className="font-normal">
        {first.title}
      </Badge>
      {rest.length > 0 ? (
        <span className="text-xs text-muted-foreground">+{rest.length}</span>
      ) : null}
    </div>
  );
};

const columns: WidgetTableColumn<ContentRow>[] = [
  {
    id: "title",
    header: "Title",
    grow: true,
    // The title keeps the largest share in fixed layout; the four short columns
    // split the rest evenly, so none is squeezed against the trailing edge.
    className: "w-1/3",
    cell: (row) => (
      <Link
        href={`/admin/posts/${row.rootId}`}
        className="font-medium hover:underline"
      >
        {row.title}
      </Link>
    ),
  },
  {
    id: "status",
    header: "Status",
    align: "right",
    skeleton: "badge",
    cell: (row) => <StatusBadge status={row.status} />,
  },
  {
    id: "author",
    header: "Author",
    align: "right",
    skeleton: "avatar",
    // Secondary columns step out as the card narrows, so the title and status
    // always have room. The author goes first, the categories next.
    className: "hidden @md:table-cell",
    cell: (row) => <WidgetAuthorAvatar author={row.author} />,
  },
  {
    id: "categories",
    header: "Categories",
    align: "right",
    skeleton: "badge",
    className: "hidden @lg:table-cell",
    cell: (row) => <CategoryBadges categories={row.categories} />,
  },
  {
    id: "updatedAt",
    header: "Updated",
    align: "right",
    cell: (row) => (
      <span className="text-muted-foreground">
        {formatDate({ date: row.updatedAt })}
      </span>
    ),
  },
];

export const DraftsWidget = ({ instance }: WidgetComponentProps) => {
  const trpc = useTRPC();
  const statuses = resolveStatuses(instance.config?.statuses);
  const { data } = useSuspenseQuery(
    trpc.posts.getDrafts.queryOptions({ statuses }),
  );

  return (
    <WidgetTable
      columns={columns}
      rows={data.items}
      rowKey={(row) => row.versionId}
      rowHref={(row) => `/admin/posts/${row.rootId}` as Route}
      count={data.count}
      href="/admin/posts"
      linkLabel="View all posts"
      fixed
      emptyMessage="No content to publish."
    />
  );
};

export const DraftsWidgetSkeleton = () => (
  <WidgetTableSkeleton
    columns={columns}
    rows={DASHBOARD_LIST_LIMIT}
    href="/admin/posts"
    linkLabel="View all posts"
    fixed
  />
);
