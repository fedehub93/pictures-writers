import { getAuthorsString } from "@/data/user";
import { User } from "@prisma/client";
import { formatDistance } from "date-fns";
import { it } from "date-fns/locale";

interface PostInfoV2Props {
  categoryTitle: string;
  categorySlug: string;
  authors: User[];
  publishedAt: Date;
}

const PostInfoV2 = ({
  categoryTitle,
  categorySlug,
  authors,
  publishedAt,
}: PostInfoV2Props): JSX.Element => {
  const authorsString = getAuthorsString(authors);

  return (
    <div className="mb-4 border-b border-b-gray-300 pb-2 text-xs text-gray-500">
      {`By ${authorsString} / Aggiornato ${formatDistance(
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

export default PostInfoV2;
