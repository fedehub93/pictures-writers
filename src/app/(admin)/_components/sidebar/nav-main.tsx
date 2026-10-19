"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/shared/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/shared/ui/sidebar";

import { type NavItem, type NavObject } from "./nav-data";

function NavLink({ item }: { item: NavItem }) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton asChild>
        <Link href={item.url}>
          {item.Icon && <item.Icon />}
          {item.title}
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}

export function NavMain({
  label,
  items,
}: {
  label: string;
  items: NavObject[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-muted-foreground">
        {label}
      </SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = Boolean(item.items?.length || item.groups?.length);

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link href={item.url}>
                    {item.Icon && <item.Icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible key={item.title} asChild className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.Icon && <item.Icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex flex-col gap-1">
                  {item.groups?.map((group) => (
                    <div key={group.label}>
                      <div className="px-2 pt-1 pb-0.5 text-xs font-medium text-muted-foreground">
                        {group.label}
                      </div>
                      <SidebarMenuSub>
                        {group.items.map((subItem) => (
                          <NavLink key={subItem.title} item={subItem} />
                        ))}
                      </SidebarMenuSub>
                    </div>
                  ))}
                  {item.items?.length ? (
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <NavLink key={subItem.title} item={subItem} />
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
