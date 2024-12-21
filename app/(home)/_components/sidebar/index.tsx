import { WidgetSection, WidgetType } from "@prisma/client";
import { db } from "@/lib/db";

import SidebarCategories from "./sidebar-categories";
import SidebarEbook from "./sidebar-ebook";
import SidebarLatestNews from "./sidebar-latest-news";
import SidebarSearch from "./sidebar-search";

import { isValidWidgetMetadata } from "@/type-guards";
import { WidgetPost } from "@/components/widget/post";

interface SidebarProps {
  postId?: string;
  categoryId?: string;
}

const Sidebar = async ({ postId, categoryId }: SidebarProps) => {
  const widgets = await db.widget.findMany({
    where: {
      section: WidgetSection.SIDEBAR,
      isEnabled: true,
    },
    orderBy: { sort: "asc" },
  });

  return (
    <div className="flex flex-col gap-y-4">
      {widgets.map((w) => {
        if (!isValidWidgetMetadata(w.metadata)) {
          return null;
        }
        if (w.metadata.type === WidgetType.SEARCH_BOX) {
          return <SidebarSearch key={w.name} />;
        }
        if (w.metadata.type === WidgetType.POST && postId && categoryId) {
          return (
            <WidgetPost
              key={w.name}
              label={w.metadata.label}
              postId={postId}
              postType={w.metadata.postType}
              posts={w.metadata.posts}
              postCategoryId={categoryId}
              categoryFilter={w.metadata.categoryType}
              categories={w.metadata.categories}
              limit={w.metadata.limit}
            />
          );
        }
      })}
      <SidebarSearch />
      <SidebarEbook />
      <SidebarLatestNews />
      <SidebarCategories />
    </div>
  );
};

export default Sidebar;
