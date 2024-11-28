import React from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbsProps {
  items: {
    title: string;
    href?: string;
  }[];
}

export const Breadcrumbs = ({ items }: BreadcrumbsProps) => {
  const linkItems = items.slice(0, -1);
  const currentItem = items.at(-1);

  return (
    <Breadcrumb className="col-span-full">
      <BreadcrumbList>
        {linkItems.map((item) => (
          <React.Fragment key={item.title}>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-base" href={item.href}>
                {item.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </React.Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage className="text-base">
            {currentItem?.title}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
};
