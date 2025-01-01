import {
  Paragraph,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  HeadingFour,
  Link,
  AffiliateLink,
  Blockquote,
  BulletedList,
  ListItem,
  ImageElement,
  VideoElement,
  NumberedList,
  SponsorFirstImpression,
  ProductElement,
  InfoBoxElement,
} from "@/components/editor/view/elements";
import { RichText } from "@/components/editor/view/leaves";
import { PostWithImageCoverWithCategoryWithTagsWithSeo } from "@/lib/post";
import { SlateView } from "slate-to-react";

export const PostPreview = ({
  post,
}: {
  post: PostWithImageCoverWithCategoryWithTagsWithSeo;
}) => {
  return (
    <div className="post">
      <SlateView
        nodes={post.bodyData!}
        transforms={{
          elements: [
            Paragraph,
            HeadingOne,
            HeadingTwo,
            HeadingThree,
            HeadingFour,
            Link,
            AffiliateLink,
            Blockquote,
            BulletedList,
            ListItem,
            ImageElement,
            VideoElement,
            NumberedList,
            SponsorFirstImpression,
            ProductElement,
            InfoBoxElement,
          ],
          leaves: [RichText],
        }}
      />
    </div>
  );
};
