import {
  Node,
  Replace,
  createElementNodeMatcher,
  createElementTransform,
} from "slate-to-react";

import { CustomText } from "@/components/editor";

type VideoElement = Replace<
  Node<"video">,
  {
    children: CustomText[];
    altText: string;
  }
>;

export const isVideo = createElementNodeMatcher<VideoElement>(
  (node): node is VideoElement => node.type === "video"
);

export const VideoElement = createElementTransform(
  isVideo,
  ({ key, element, attributes, children }) => (
    <span className="relative mt-6 block w-full pb-[56.25%]">
      <iframe
        id="ytplayer"
        title={element.data.uri}
        src={element.data.uri}
        width="100%"
        height="600px"
        className="absolute left-0 top-0 h-full w-full"
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture ; fullscreen"
      />
    </span>
  )
);
