import { RenderLeaf } from "./render-leaf";
import { ParagraphElement } from "../elements/paragraph";
import {
  AffiliateLinkElement,
  BlockquoteElement,
  BulletedListElement,
  FirstImpressionSnippetElement,
  HeadingFourElement,
  HeadingOneElement,
  HeadingThreeElement,
  HeadingTwoElement,
  ImageElement,
  InfoBoxElement,
  LinkElement,
  ListItemElement,
  NumberedListElement,
  ProductElement,
  VideoElement,
} from "../elements";
import { CustomElement, isCustomText } from "../slate-renderer";

export const RenderNode = ({
  node,
  preview = false,
}: {
  node: CustomElement;
  preview?: boolean;
}) => {
  if (node.type === "paragraph") {
    return <ParagraphElement node={node} />;
  }
  if (node.type === "blockquote") {
    return <BlockquoteElement node={node} />;
  }
  if (node.type === "heading-1") {
    return <HeadingOneElement node={node} />;
  }
  if (node.type === "heading-2") {
    return <HeadingTwoElement node={node} />;
  }
  if (node.type === "heading-3") {
    return <HeadingThreeElement node={node} />;
  }
  if (node.type === "heading-4") {
    return <HeadingFourElement node={node} />;
  }
  if (node.type === "hyperlink") {
    return <LinkElement node={node} />;
  }
  if (node.type === "unordered-list") {
    return <BulletedListElement node={node} />;
  }
  if (node.type === "ordered-list") {
    return <NumberedListElement node={node} />;
  }
  if (node.type === "list-item") {
    return <ListItemElement node={node} />;
  }
  if (node.type === "affiliate-link") {
    return <AffiliateLinkElement node={node} />;
  }
  if (node.type === "sponsor-first-impression") {
    return <FirstImpressionSnippetElement node={node} />;
  }
  if (node.type === "info-box") {
    return <InfoBoxElement node={node} />;
  }
  if (node.type === "image") {
    return <ImageElement node={node} preview={preview} />;
  }
  if (node.type === "product") {
    return <ProductElement node={node} />;
  }
  if (node.type === "video") {
    return <VideoElement node={node} />;
  }
  if (isCustomText(node)) {
    return <RenderLeaf leaf={node} />;
  }

  return null;
};
