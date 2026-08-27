import type { JSX } from "react";

import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";

import { User } from "@/generated/prisma";

import { getAuthorsString } from "@/data/user";

import { getCategoriesString } from "@/modules/blog/categories/utils/get-categories-string";

interface PostInfoProps {
  categories: { title: string; slug: string }[];
  authors: User[];
  publishedAt: Date;
}

export const PostInfo = ({
  categories,
  authors,
  publishedAt,
}: PostInfoProps): JSX.Element => {
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
        },
      )} / ${categoriesString} `}
    </div>
  );
};
