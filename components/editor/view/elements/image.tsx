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
    <div className="hover:scale-[1.02] my-4 transition-all overflow-hidden duration-300 rounded-md shadow-md">
      {children}
      <Image
        src={element.url!}
        alt={element.altText}
        sizes="100vw"
        className="w-full h-auto"
        width={500}
        height={300}
      />
    </div>
  )
);
