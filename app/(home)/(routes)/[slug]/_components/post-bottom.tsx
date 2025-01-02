import { Widget, WidgetSection } from "@prisma/client";

import {
  isWidgetAuthorMetadata,
  isWidgetNewsletterMetadata,
  isWidgetTagMetadata,
} from "@/type-guards";
import WidgetAuthor from "@/components/widget/author";
import WidgetNewsletter from "@/components/widget/newsletter";
import { db } from "@/lib/db";
import WidgetTags from "@/components/widget/tags";

interface WidgetPostBottomProps {
  postId: string;
  authorId?: string;
  tags: { title: string; slug: string }[];
}

export const WidgetPostBottom = async ({
  postId,
  authorId,
  tags,
}: WidgetPostBottomProps) => {
  const widgets = await db.widget.findMany({
    where: {
      section: WidgetSection.POST_BOTTOM,
      isEnabled: true,
    },
    orderBy: { sort: "asc" },
  });

  const author = authorId
    ? await db.user.findUnique({ where: { id: authorId } })
    : null;

  return (
    <div className="flex flex-col gap-y-8">
      {widgets.map((w) => {
        if (!w.metadata) {
          return null;
        }
        if (isWidgetAuthorMetadata(w.metadata)) {
          return (
            <WidgetAuthor
              key={w.name}
              label={w.metadata.label}
              firstName={author?.firstName || ""}
              lastName={author?.lastName || ""}
              bio={author?.bio || ""}
              imageUrl={author?.imageUrl || ""}
            />
          );
        }
        if (isWidgetNewsletterMetadata(w.metadata)) {
          return <WidgetNewsletter key={w.name} label={w.metadata.label} />;
        }
        if (isWidgetTagMetadata(w.metadata)) {
          return (
            <WidgetTags key={w.name} label={w.metadata.label} tags={tags} />
          );
        }
      })}
    </div>
  );
};
