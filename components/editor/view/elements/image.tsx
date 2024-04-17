import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";
import Image from "next/image";

import { CustomText } from "@/components/editor";

type ImageElement = Replace<
  Node<"image">,
  {
    children: CustomText[];
    altText: string;
  }
>;

export const isImage = createElementNodeMatcher<ImageElement>(
  (node): node is ImageElement => node.type === "image"
);

export const ImageElement = createElementTransform(
  isImage,
  ({ key, element, attributes, children }) => (
    <div key={key}>
      {children}
      <div
        contentEditable={false}
        className="relative group shadow-md w-full aspect-video"
      >
        <Image
          src={element.url!}
          alt={element.altText}
          fill
          className="rounded-md object-cover"
        />
      </div>
    </div>
  )
);
