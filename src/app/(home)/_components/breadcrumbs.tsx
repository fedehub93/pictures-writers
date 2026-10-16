import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/ui/breadcrumb";

interface BreadcrumbsProps {
  items: {
    title: string;
    href?: string;
  }[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  return (
    <Breadcrumb className="col-span-full">
      <BreadcrumbList>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <React.Fragment key={item.title}>
              <BreadcrumbItem>
                {isLast && !item.href ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={item.href}>
                    {item.title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
};
