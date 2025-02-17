import Link from "next/link";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";

import type { JSX } from "react";

interface PostInfoProps {
  categoryTitle: string;
  categorySlug: string;
  authorName: string;
  publishedAt: Date;
}

const PostInfo = ({
  categoryTitle,
  categorySlug,
  authorName,
  publishedAt,
}: PostInfoProps): JSX.Element => {
  return (
    <div className="mb-4 border-b border-b-gray-300 pb-2 text-xs text-gray-500">
      {`By ${authorName} / Aggiornato ${formatDistance(
        publishedAt,
        new Date(),
        {
          addSuffix: true,
          locale: it,
        }
      )} / ${categoryTitle} `}
    </div>
  );
};

export default PostInfo;
