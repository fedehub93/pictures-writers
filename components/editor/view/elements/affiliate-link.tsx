import NextLink from "next/link";

import { RenderLeaf } from "../helpers/render-leaf";
import { CustomElement } from "../slate-renderer";

export const AffiliateLinkElement = ({ node }: { node: CustomElement }) => {
  return (
    <div className="flex items-center justify-center mx-auto w-full button-base">
      <NextLink
        href={node.data.uri}
        rel="noopener noreferrer nofollow"
        target={"_blank"}
        className=" px-4 py-2 text-white rounded-sm button-base bg-green-600 hover:bg-green-600 my-4 font-bold"
      >
        {node.data.label}
        {node.children.map((child: any, i: number) => (
          <RenderLeaf key={i} leaf={child} />
        ))}
      </NextLink>
    </div>
  );
};
