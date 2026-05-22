import Image from "next/image";

import { RenderNode } from "../helpers/render-node";
import { CustomElement } from "../slate-renderer";

interface ImageElementProps {
  node: CustomElement;
  preview?: boolean;
}

export const ImageElement = ({ node, preview = false }: ImageElementProps) => {
  return (
    <div className="post__image">
      {node.children.map((child: any, i: number) => (
        <RenderNode key={i} node={child} />
      ))}
      <Image
        src={node.url!}
        alt={
          node.altText
            ? node.altText
            : node.data.altText
            ? node.data.altText
            : ""
        }
        className="w-full h-auto"
        width={500}
        height={300}
        sizes="(max-width: 1280px) 90vw, 40vw"
        unoptimized={preview}
      />
    </div>
  );
};
