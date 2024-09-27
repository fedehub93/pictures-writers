import { Tag } from "lucide-react";
import Link from "next/link";

interface TagsProps {
  tags: ReadonlyArray<{ title: string; slug: string }>;
}

const TagsWidget = (props: TagsProps) => {
  const { tags } = props;
  if (!tags || tags.length === 0) return null;
  return (
    <div className="tags">
      <Tag className="h-4 w-4 mr-2" />
      <h6 className="tags__title">Tags:</h6>
      {tags.map((tag, i) => (
        <Link
          key={tag.slug}
          className="text-sm leading-3 text-gray-600"
          href={`/blog/${tag.slug}`}
        >
          {`${tags.length === i + 1 ? tag.title : `${tag.title}, `}`}
        </Link>
      ))}
    </div>
  );
};

export default TagsWidget;
