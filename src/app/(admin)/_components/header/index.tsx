"use client";

import React from "react";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";

import { Separator } from "@/shared/ui/separator";
import { SidebarTrigger } from "@/shared/ui/sidebar";

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
  const totalSegments = segments.length;

  const breadcrumbs = segments.map((seg, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const name = seg;
    const isLast = index === totalSegments - 1;
    const isSecondToLast = index === totalSegments - 2;

    // In mobile mostra SOLO il penultimo elemento. Su desktop mostra TUTTI gli elementi.
    const itemVisibility = isSecondToLast
      ? "flex md:flex"
      : "hidden md:flex";

    // Su mobile i separatori sono sempre nascosti. Su desktop sono visibili tranne l'ultimo.
    const separatorVisibility = !isLast ? "hidden md:flex" : "hidden";

    return (
      <React.Fragment key={href}>
        <BreadcrumbItem className={itemVisibility}>
          <BreadcrumbLink href={href} className="capitalize">
            {name}
          </BreadcrumbLink>
        </BreadcrumbItem>
        {!isLast && (
          <BreadcrumbSeparator className={separatorVisibility} />
        )}
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