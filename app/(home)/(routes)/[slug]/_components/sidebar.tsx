import { WidgetSection, WidgetType } from "@prisma/client";
import { db } from "@/lib/db";

import {
  isWidgetCategoryMetadata,
  isWidgetPostMetadata,
  isWidgetProductMetadata,
} from "@/type-guards";

import StickyWrapper from "./sticky-wrapper";

import { WidgetPost } from "@/components/widget/post";
import { WidgetProduct } from "@/components/widget/product";
import { WidgetSearchBox } from "@/components/widget/search-box";
import { WidgetCategory } from "@/components/widget/category";

interface PostSidebarProps {
  postId: string;
  categoryId: string;
}

const Sidebar = async ({ postId, categoryId }: PostSidebarProps) => {
  const widgets = await db.widget.findMany({
    where: {
      section: WidgetSection.POST_SIDEBAR,
      isEnabled: true,
    },
    orderBy: { sort: "asc" },
  });

  return (
    <StickyWrapper>
      <div className="flex flex-col gap-y-4">
        {widgets.map((w) => {
          if (!w.metadata) {
            return null;
          }
          if (w.metadata.type === WidgetType.SEARCH_BOX) {
            return <WidgetSearchBox key={w.name} />;
          }
          if (isWidgetPostMetadata(w.metadata)) {
            return (
              <WidgetPost
                key={w.name}
                label={w.metadata.label}
                postType={w.metadata.postType}
                posts={w.metadata.posts}
                postCategoryId={categoryId}
                categoryFilter={w.metadata.categoryFilter}
                categories={w.metadata.categories}
                limit={w.metadata.limit}
              />
            );
          }
          if (isWidgetCategoryMetadata(w.metadata)) {
            return (
              <WidgetCategory
                key={w.name}
                label={w.metadata.label}
                categoryType={w.metadata.categoryType}
                limit={w.metadata.limit}
              />
            );
          }
          if (isWidgetProductMetadata(w.metadata)) {
            return (
              <WidgetProduct
                key={w.name}
                label={w.metadata.label}
                productType={w.metadata.productType}
                products={w.metadata.products}
                limit={w.metadata.limit}
              />
            );
          }
        })}
      </div>
    </StickyWrapper>
  );
};

export default Sidebar;