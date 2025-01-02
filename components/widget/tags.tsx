import Link from "next/link";

import { Tag } from "lucide-react";

interface TagsProps {
  label: string;
  tags: ReadonlyArray<{ title: string; slug: string }>;
}

const WidgetTags = ({ label, tags }: TagsProps) => {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="tags">
      <Tag className="h-4 w-4 mr-2" />
      <h6 className="tags__title">{label}</h6>
      {tags.map((tag, i) => (
        <Link
          key={tag.slug}
          className="text-sm leading-3 text-gray-600"
          href={`/blog/${tag.slug}`}
          prefetch={true}
        >
          {`${tags.length === i + 1 ? tag.title : `${tag.title}, `}`}
        </Link>
      ))}
    </div>
  );
};

export default WidgetTags;
