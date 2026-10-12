import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { Button } from "@/shared/ui/button";

import { WidgetEmpty } from "./widget-states";

interface WidgetListProps {
  count: number;
  isEmpty: boolean;
  emptyMessage: string;
  href: Route;
  linkLabel: string;
  children: ReactNode;
}

/**
 * The shared body of an operational Dashboard widget: a headline count, a short
 * list of records, and a link to the destination list filtered by status.
 */
export const WidgetList = ({
  count,
  isEmpty,
  emptyMessage,
  href,
  linkLabel,
  children,
}: WidgetListProps) => {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="text-3xl font-bold">{count}</div>

      {isEmpty ? (
        <WidgetEmpty message={emptyMessage} />
      ) : (
        <ul className="flex flex-col gap-2">{children}</ul>
      )}

      <Button variant="link" size="sm" className="mt-auto self-start" asChild>
        <Link href={href}>{linkLabel}</Link>
      </Button>
    </div>
  );
};
