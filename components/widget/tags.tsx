import Link from "next/link";

import { Tag } from "lucide-react";
import { Badge } from "../ui/badge";

interface TagsProps {
  label: string;
  tags: ReadonlyArray<{ title: string; slug: string }>;
}

const WidgetTags = ({ label, tags }: TagsProps) => {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="tags">
      <div className="flex items-center">
        <Tag className="h-4 w-4 mr-2" />
        <h6 className="tags__title">{label}</h6>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-2">
        {tags.map((tag, i) => (
          <Link
            key={tag.slug}
            className="text-sm leading-3 text-gray-600"
            href={`/blog/${tag.slug}`}
            // prefetch={true}
          >
            <Badge>{tag.title}</Badge>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default WidgetTags;
