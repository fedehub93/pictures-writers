import { SlateView } from "slate-to-react";

import {
  Blockquote,
  BulletedList,
  HeadingFour,
  HeadingOne,
  HeadingThree,
  HeadingTwo,
  ImageElement,
  VideoElement,
  Link,
  ListItem,
  NumberedList,
  Paragraph,
  SponsorFirstImpression,
  AffiliateLink,
  ProductElement,
} from "@/components/editor/view/elements";
import { RichText } from "@/components/editor/view/leaves";

interface CustomSlateViewProps {
  nodes: PrismaJson.BodyData;
}

const CustomSlateView = ({ nodes }: CustomSlateViewProps) => {
  return (
    <SlateView
      nodes={nodes}
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
          ProductElement
        ],
        leaves: [RichText],
      }}
    />
  );
};

export default CustomSlateView;
