import { Widget, WidgetSection } from "@/prisma/generated/client";

import {
  isWidgetAuthorMetadata,
  isWidgetNewsletterMetadata,
  isWidgetTagMetadata,
} from "@/type-guards";
import WidgetAuthor from "@/components/widget/author";
import WidgetNewsletter from "@/components/widget/newsletter";
import { db } from "@/lib/db";
import WidgetTags from "@/components/widget/tags";
import WidgetAuthors from "@/components/widget/authors";

interface WidgetPostBottomProps {
  postId: string;
  tags: { title: string; slug: string }[];
}

export const WidgetPostBottom = async ({
  postId,
  tags,
}: WidgetPostBottomProps) => {
  const widgets = await db.widget.findMany({
    where: {
      section: WidgetSection.POST_BOTTOM,
      isEnabled: true,
    },
    orderBy: { sort: "asc" },
  });

  const postAuthors = await db.postAuthor.findMany({
    where: {
      postId,
    },
    select: {
      user: true,
    },
    orderBy: {
      sort: "asc",
    },
  });

  const authors = postAuthors.map((v) => v.user);

  return (
    <div className="flex flex-col gap-y-8">
      {widgets.map((w) => {
        if (!w.metadata) {
          return null;
        }
        if (isWidgetAuthorMetadata(w.metadata)) {
          return <WidgetAuthors key={w.name} authors={authors} />;
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
