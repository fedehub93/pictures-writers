"use client";

import React from "react";
import { usePathname } from "next/navigation";

import { User } from "@/prisma/generated/client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

import { Actions } from "../navbar/actions";

interface HeaderProps {
  user: {
    id: string;
    email: string;
    imageUrl: string;
  };
}

export const Header = ({ user }: HeaderProps) => {
  const pathname = usePathname();

  const segments = pathname.split("/").filter((seg) => seg !== "");
  // const routes = getRouteNameMap();

  const breadcrumbs = segments.map((seg, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const name = seg;
    const isLast = index === segments.length - 1;

    return (
      <React.Fragment key={href}>
        <BreadcrumbItem className="block">
          <BreadcrumbLink href={href} className="capitalize">
            {name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator className="block" />}
      </React.Fragment>
    );
  });

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4!" />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((item, i) => (
            <React.Fragment key={i}>{item}</React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto">
        <Actions user={user} />
      </div>
    </header>
  );
};
