"use client";

import { Wrapper } from "./wrapper";
import { Toggle } from "./toggle";
import { MenuGroup } from "./menu-group";
import { MenuItem } from "./menu-item";
import {
  BookImage,
  Boxes,
  CheckCircle2,
  LayoutDashboard,
  Mails,
  NotebookPen,
  Settings,
  Sparkles,
  Tags,
  Users,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export const Sidebar = () => {
  return (
    <Wrapper>
      <Toggle />
      <ScrollArea className="flex flex-col h-full">
        <div className="flex-1 h-full space-y-2 lg:space-y-4 pt-4 lg:pt-0">
          <div className="px-2">
            <MenuItem
              label="Dashboard"
              href="/admin/dashboard"
              icon={LayoutDashboard}
            />
          </div>
          <MenuGroup label="Contents">
            <MenuItem label="Posts" href="/admin/posts" icon={NotebookPen} />
            <MenuItem
              label="Categories"
              href="/admin/categories"
              icon={Boxes}
            />
            <MenuItem label="Tags" href="/admin/tags" icon={Tags} />
          </MenuGroup>
          <MenuGroup label="Users">
            <MenuItem label="All users" href="/admin/users" icon={Users} />
            <MenuItem
              label="Subscriptions"
              href="/admin/subscriptions"
              icon={CheckCircle2}
            />
          </MenuGroup>
          <MenuGroup label="Plugins">
            <MenuItem label="Media" href="/admin/media" icon={BookImage} />
            <MenuItem label="SEO" href="/admin/seo" icon={Sparkles} />
            <MenuItem
              label="Newsletters"
              href="/admin/newsletters"
              icon={Mails}
            />
          </MenuGroup>
        </div>
        <div className="py-4">
          <MenuGroup label="General">
            <MenuItem label="Settings" href="/admin/settings" icon={Settings} />
          </MenuGroup>
        </div>
      </ScrollArea>
    </Wrapper>
  );
};
