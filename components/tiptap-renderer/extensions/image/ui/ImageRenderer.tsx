import Image from "next/image";
import { Node } from "@tiptap/pm/model";

interface ImageRendererProps {
  node: Node;
  preview?: boolean;
}

export const ImageRenderer = ({
  node,
  preview = false,
}: ImageRendererProps) => {
  return (
    <div className="post__image">
      <Image
        src={node.attrs.src!}
        alt={node.attrs.alt ? node.attrs.alt : "image-alt"}
        className="w-full h-auto"
        width={500}
        height={300}
        sizes="(max-width: 1280px) 90vw, 40vw"
        unoptimized={preview}
      />
    </div>
  );
};
