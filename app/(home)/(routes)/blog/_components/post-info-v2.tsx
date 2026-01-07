import { getCategoriesString } from "@/data/category";
import { getAuthorsString } from "@/data/user";
import { User } from "@/prisma/generated/client";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";

import type { JSX } from "react";

interface PostInfoV2Props {
  categories: { title: string; slug: string }[];
  authors: User[];
  publishedAt: Date;
}

const PostInfoV2 = ({
  categories,
  authors,
  publishedAt,
}: PostInfoV2Props): JSX.Element => {
  const authorsString = getAuthorsString(authors);
  const categoriesString = getCategoriesString(categories);

  return (
    <div className="mb-4 border-b border-b-gray-300 pb-2 text-xs text-gray-500">
      {`By ${authorsString} / Aggiornato ${formatDistance(
        publishedAt,
        new Date(),
        {
          addSuffix: true,
          locale: it,
        }
      )} / ${categoriesString} `}
    </div>
  );
};

export default PostInfoV2;
